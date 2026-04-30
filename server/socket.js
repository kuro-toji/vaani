import { Server } from 'socket.io';

const connectedUsers = new Map();

// ─── SHARED SECURITY & SESSION MANAGEMENT ────────────────────────────────────

// Import from shared security module
import { sanitizeInput, isOffTopicRequest, stripThinkTags, VAANI_SYSTEM_PROMPT } from './utils/security.js';

// Server-side session store — keyed by userId
// In production, replace with Redis
const chatSessions = new Map();

function getSession(userId) {
  if (!chatSessions.has(userId)) {
    chatSessions.set(userId, {
      history: [],
      lastActivity: Date.now(),
    });
  }
  return chatSessions.get(userId);
}

function addToSession(userId, role, content) {
  const session = getSession(userId);
  session.history.push({ role, content, ts: Date.now() });
  session.lastActivity = Date.now();
  // Keep only last 10 exchanges (20 messages)
  if (session.history.length > 20) {
    session.history = session.history.slice(-20);
  }
}

// Clean up old sessions every 30 minutes
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [userId, session] of chatSessions.entries()) {
    if (session.lastActivity < cutoff) chatSessions.delete(userId);
  }
}, 30 * 60 * 1000);

// ─── SOCKET.IO INIT ──────────────────────────────────────────────────────────

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:4173'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('auth:join', ({ userId }) => {
      if (!userId) return;
      socket.userId = userId;
      connectedUsers.set(socket.id, { userId });
      socket.join(`user:${userId}`);
      console.log(`[Socket] User ${userId} joined (${socket.id})`);
      socket.emit('auth:joined', { status: 'ok' });
    });

    socket.on('chat:message', async ({ text, language, fromVoice }) => {
      try {
        const userId = socket.userId;
        const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        const MINIMAX_ENDPOINT = 'https://api.minimax.io/v1/text/chatcompletion_v2';

        // Auth check
        if (!userId) {
          return socket.emit('chat:error', { message: 'Not authenticated' });
        }

        const lang = language || 'hi';
        
        // Guard 1: Sanitize input
        const rawText = text?.trim() || '';
        const cleanText = sanitizeInput(rawText);
        
        if (!cleanText) {
          socket.emit('chat:error', { message: 'Message required' });
          return;
        }
        
        // Guard 2: Off-topic block
        if (isOffTopicRequest(cleanText)) {
          const block = lang === 'hi'
            ? 'Main sirf aapka financial advisor hoon. Paisa, bachat, nivesh — yahi mere kaam ki baatein hain. Koi financial sawaal hai?'
            : 'I am only a financial advisor. I can help with savings, investments, taxes, and budgeting. What financial question can I help with?';
          
          for (const char of block) {
            socket.emit('chat:token', { token: char, id: `asst-${Date.now()}` });
            await new Promise(r => setTimeout(r, 15));
          }
          socket.emit('chat:done', { id: `asst-${Date.now()}`, fullResponse: block, fromVoice });
          return;
        }

        // Get server-side session
        const session = getSession(userId);
        
        // Build messages from SERVER-SIDE history (never trust client-sent history)
        const messages = [
          { role: 'system', content: VAANI_SYSTEM_PROMPT },
          ...session.history.slice(-10),  // last 5 exchanges
          { role: 'user', content: cleanText },
        ];

        const assistantId = `asst-${Date.now()}`;
        let fullResponse = '';

        // Try Groq first (free tier, more reliable)
        if (GROQ_API_KEY) {
          try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                max_tokens: 200,
                temperature: 0.7,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              let content = 
                data?.choices?.[0]?.message?.content ||
                data?.choices?.[0]?.messages?.[0]?.content ||
                '';
              
              if (!content) {
                console.error('[Groq] Empty response. Raw:', JSON.stringify(data).slice(0, 300));
              }
              
              // Strip think tags
              content = stripThinkTags(content);
              
              if (content) {
                fullResponse = content;
                // Stream token by token
                for (const char of content) {
                  socket.emit('chat:token', { token: char, id: assistantId });
                  await new Promise(r => setTimeout(r, 15));
                }
              }
            } else {
              const err = await response.text();
              console.error('[Socket] Groq error:', response.status, err);
            }
          } catch (apiErr) {
            console.error('[Socket] Groq API error:', apiErr.message);
          }
        }

        // Try MiniMax if Groq failed
        if (!fullResponse && MINIMAX_API_KEY) {
          try {
            const response = await fetch(MINIMAX_ENDPOINT, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MINIMAX_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'MiniMax-M2.7',
                messages,
                stream: true,
                max_tokens: 512,
                temperature: 0.8,
              }),
            });

            if (response.ok && response.body) {
              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';

              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';

                  for (const line of lines) {
                    if (!line.trim() || line.startsWith(':')) continue;

                    let content = '';
                    try {
                      const match = line.match(/^data:\s*(.+)/);
                      if (match) {
                        const parsed = JSON.parse(match[1]);
                        content = parsed?.choices?.[0]?.delta?.content
                          || parsed?.choices?.[0]?.message?.content
                          || parsed?.choices?.[0]?.messages?.[0]?.content
                          || '';
                      }
                    } catch {}

                    if (content) {
                      fullResponse += content;
                      socket.emit('chat:token', { token: content, id: assistantId });
                    }
                  }
                }
              } catch (streamErr) {
                console.error('[Socket] MiniMax stream error:', streamErr.message);
              }
            }
          } catch (apiErr) {
            console.error('[Socket] MiniMax API error:', apiErr.message);
          }
        }

        // Strip think tags from accumulated response
        fullResponse = stripThinkTags(fullResponse);

        // Store in server-side session AFTER getting response
        if (fullResponse) {
          addToSession(userId, 'user', cleanText);
          addToSession(userId, 'assistant', fullResponse);
        }

        // Final fallback with language-specific responses
        if (!fullResponse) {
          const fallbacks = {
            hi: 'Namaskar! Main VAANI hoon, aapka financial advisor. Aap mujhse FD rates, SIP, ya koi bhi financial question puchh sakte hain. Main aapki madad ke liye hoon!',
            en: 'Namaste! I am VAANI, your financial assistant. You can ask me about FD rates, SIP investments, or any financial topic. I am here to help!',
            bn: 'নমস্কার! আমি VAANI, আপনার আর্থিক উপদেষ্টা। আপনি FD রেট, SIP বা যেকোনো আর্থিক বিষয়ে জিজ্ঞাসা করতে পারেন।',
            te: 'Namaste! Na VAANI, mee financial advisor. FD rates, SIP, ela chesthunna financial question.',
            ta: 'வணக்கம்! நான் VAANI, உங்கள் financial advisor. FD விகிதங்கள், SIP அல்லது நிதி தொடர்பான ஏதேனும் கேள்ளி கேட்கலாம',
            mr: 'नमस्कार! मी VAANI, तुमचा financial advisor. तुम्ही मला FD rates, SIP किंवा कोणत्याही financial विषयाबद्दल विचारू शकता.',
            gu: 'નમસ્કાર! હું VAANI, તમારો financial advisor. તમે મને FD rates, SIP કે કોઈપણ financial વિષે પૂછી શકો છો.',
            kn: 'ನಮಸ್ಕಾರ! ನಾನು VAANI, ನಿಮ್ಮ financial advisor. ನೀವು FD rates, SIP ಅಥವಾ ಯಾವುದೇ financial ವಿಷಯದ ಬಗ್ಗೆ ಕೇಳಬಹುದು.',
            ml: 'നമസ്കാരം! ഞാന്‍ VAANI, നിങ്ങളുടെ financial advisor. നിങ്ങള്‍ക്ക് FD നിരക്ക്, SIP അല്ലെങ്കില്‍ ഏതെങ്കിലും സാമ്പത്തിക ചോദ്യം ചോദ്യം ചെയ്യാം.',
            pa: 'ਨਮਸਕਾਰ! ਮੈਂ VAANI, ਤੁਹਾਡਾ ਵਿੱਤੀ ਸਲਾਹਕਾਰ। ਤੁਸੀਂ ਮੈਨੂੰ FD ਦਰਾਂ, SIP ਜਾਂ ਕਿਸੇ ਵੀ ਵਿੱਤੀ ਵਿਸ਼ੇ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।',
            ur: 'السلام علیکم! میں VAANI، آپ کا مالی مشیر ہوں۔ آپ مجھ سے FD کی شرحوں، SIP یا کسی بھی مالی موضوع کے بارے میں پوچھ سکتے ہیں۔',
          };
          fullResponse = fallbacks[lang] || fallbacks.default;
          console.log('[Socket] Using fallback response for lang:', lang);
          
          // Stream token by token
          for (const char of fullResponse) {
            socket.emit('chat:token', { token: char, id: assistantId });
            await new Promise(r => setTimeout(r, 15));
          }
          
          // Store fallback in session too
          addToSession(userId, 'user', cleanText);
          addToSession(userId, 'assistant', fullResponse);
        }

        // Send completion
        socket.emit('chat:done', {
          id: assistantId,
          fullResponse,
          fromVoice,
        });

      } catch (err) {
        console.error('[Socket] Chat error:', err);
        socket.emit('chat:error', { message: 'Chat service temporarily unavailable.' });
      }
    });

    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        socket.leave(`user:${user.userId}`);
        connectedUsers.delete(socket.id);
        console.log(`[Socket] Disconnected: ${socket.id} (user: ${user.userId})`);
      }
    });
  });

  return io;
}

export default { initSocket };
import { Server } from 'socket.io';

const connectedUsers = new Map();

/**
 * Initialize Socket.io server on top of Express.
 */
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

        const lang = language || 'hi';
        
        // Build system prompt based on language
        const systemPrompts = {
          hi: `आप VAANI हैं, भारत के ग्रामीण क्षेत्रों के लिए एक भरोसेमंद वित्तीय सलाहकार। आप हिंदी में बात करते हैं। FD = "गल्ला बंध" (fixed deposit), SIP = "हर महीने निवेश"। villages के स्तर के उदाहरण दें। 150 शब्दों से कम जवाब दें।`,
          en: `You are VAANI, a trusted voice-first financial advisor for India. Speak in the user's language. Use village-level analogies. Keep responses under 150 words. FD = "galla band" (fixed deposit), SIP = "monthly investment".`,
          default: `You are VAANI, a trusted financial advisor. Keep responses under 150 words.`,
        };
        const systemPrompt = systemPrompts[lang] || systemPrompts.default;

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
                model: 'llama-3.1-70b-versatile',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: text },
                ],
                max_tokens: 200,
                temperature: 0.7,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              const content = data?.choices?.[0]?.message?.content || '';
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
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: text },
                ],
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

        // Final fallback with language-specific responses
        if (!fullResponse) {
          const fallbacks = {
            hi: 'Namaskar! Main VAANI hoon, aapka financial advisor. Aap mujhse FD rates, SIP, ya koi bhi financial question puchh sakte hain. Main aapki madad ke liye hoon!',
            en: 'Namaste! I am VAANI, your financial assistant. You can ask me about FD rates, SIP investments, or any financial topic. I am here to help!',
            bn: 'নমস্কার! আমি VAANI, আপনার আর্থিক উপদেষ্টা। আপনি FD রেট, SIP বা যেকোনো আর্থিক বিষয়ে জিজ্ঞাসা করতে পারেন।',
            te: 'Namaste! Na VAANI, mee financial advisor. FD rates, SIP, ela chesthunna financial question济चेसतु न्नु.',
            ta: 'வணக்கம்! நான் VAANI, உங்கள் நிதி ஆலோசகர். FD விகிதங்கள், SIP முதலீடு அல்லது நிதி தொடர்பான ஏதேனும் கேள்ளி கேட்கலாம',
            mr: 'नमस्कार! मी VAANI, तुमचा financial advisor. तुम्ही मला FD rates, SIP किंवा कोणत्याही financial विषयाबद्दल विचारू शकता.',
            gu: 'નમસ્���ા��! હું VAANI, તમારો financial advisor. તમે મને FD rates, SIP કે કોઈપણ financial વિષે પૂછી શકો છો.',
            kn: 'ನಮಸ್ಕಾರ! ನಾನು VAANI, ನಿಮ್ಮ financial advisor. ನೀವು FD rates, SIP ಅಥವಾ ಯಾವುದೇ financial ವಿಷಯದ ಬಗ್ಗೆ ಕೇಳಬಹುದು.',
            ml: 'നമസ്കാരം! ഞാന്‍ VAANI, നിങ്ങളുടെ സാമ്പത്തിക ഉപദেষ്ടാവ്. നിങ്ങള്‍ക്ക് FD നിരക്ക്, SIP അല്ലെങ്കില്‍ ഏതെങ്കിലും സാമ്പത്തിക ചോദ്യം ചോദ്യം ചെയ്യാം.',
            pa: 'ਨਮਸਕਾਰ! ਮੈਂ VAANI, ਤੁਹਾਡਾ ਵਿੱਤੀ ਸਲਾਹਕਾਰ। ਤੁਸੀਂ ਮੈਨੂੰ FD ਦਰਾਂ, SID ਜਾਂ ਕਿਸੇ ਵੀ ਵਿੱਤੀ ਵਿਸ਼ੇ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।',
            ur: 'السلام علیکم! میں VAANI، آپ کا مالی مشیر ہوں۔ آپ مجھ سے FD کی شرحوں، SIP یا کسی بھی مالی موضوع کے بارے میں پوچھ سکتے ہیں۔',
          };
          fullResponse = fallbacks[lang] || fallbacks.default;
          console.log('[Socket] Using fallback response for lang:', lang);
          
          // Stream token by token
          for (const char of fullResponse) {
            socket.emit('chat:token', { token: char, id: assistantId });
            await new Promise(r => setTimeout(r, 15));
          }
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
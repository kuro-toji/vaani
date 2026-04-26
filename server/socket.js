import { Server } from 'socket.io';

const connectedUsers = new Map(); // socketId → { userId, room }

/**
 * Initialize Socket.io server on top of Express.
 * @param {import('http').Server} httpServer - The HTTP server instance
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

  // ── Connection handler ──────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Join user room on auth
    socket.on('auth:join', ({ userId }) => {
      if (!userId) return;
      socket.userId = userId;
      connectedUsers.set(socket.id, { userId });
      socket.join(`user:${userId}`);
      console.log(`[Socket] User ${userId} joined (${socket.id})`);
      socket.emit('auth:joined', { status: 'ok' });
    });

    // ── Chat: streaming message ───────────────────────────────────────
    socket.on('chat:message', async ({ text, language, fromVoice }) => {
      try {
        const userId = socket.userId;
        const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
        const MINIMAX_ENDPOINT = 'https://api.minimax.chat/v1/text/chatcompletion_pro?Model=Minimax-Text-01';

        // Build system prompt based on language
        const systemPrompt = `Role: You are VAANI, a trusted voice-first financial advisor for India.
You speak in the user's language (${language || 'hi'}).
You are warm, patient, and use village-level analogies for complex financial concepts.
FD = 'galla band' (fixed deposit). SIP = 'har mahine invest'.
You provide factual information only. Keep responses under 150 words.
Never ask for Aadhaar, PAN, or full bank details.`;

        const assistantId = `asst-${Date.now()}`;
        let fullResponse = '';

        // Try MiniMax streaming
        if (MINIMAX_API_KEY) {
          try {
            const response = await fetch(MINIMAX_ENDPOINT, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MINIMAX_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'MiniMax-Text-01',
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
                          || parsed?.choices?.[0]?.messages?.[0]?.content
                          || '';
                      }
                    } catch {}

                    if (content) {
                      fullResponse += content;
                      // Send token to client
                      socket.emit('chat:token', { token: content, id: assistantId });
                    }
                  }
                }
              } catch (streamErr) {
                console.error('[Socket] Stream error:', streamErr.message);
              }
            }
          } catch (apiErr) {
            console.error('[Socket] MiniMax API error:', apiErr.message);
          }
        }

        // If no response (API key missing or error), use fallback
        if (!fullResponse) {
          const fallbacks = {
            hi: 'Namaskar! Main VAANI hoon. Aapke financial planning mein madad karunga. FD, SIP, ya expenses — sab kuchh batayein!',
            default: 'Hello! I am VAANI, your financial assistant. Ask me about FD rates, SIP, or any financial topic.',
          };
          fullResponse = fallbacks[language] || fallbacks.default;
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

    // ── Disconnect ──────────────────────────────────────────────────────
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
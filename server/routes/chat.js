import express from 'express';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_ENDPOINT = 'https://api.minimax.chat/v1/text/chatcompletion_pro?Model=Minimax-Text-01';

const BANK_PRODUCTS = [
  { bank: 'Suryoday', rate: '9.1%', tenor: '18 months', note: 'Extra 0.25% for senior citizens' },
  { bank: 'Utkarsh', rate: '8.5%', tenor: '12 months', note: 'No penalty on early withdrawal' },
  { bank: 'Jana', rate: '8.25%', tenor: '24 months', note: 'Best for 2-year lock-in' },
];

router.post('/', async (req, res) => {
  try {
    const { message, language, emotionState, chatHistory, systemPrompt } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    // Build messages array for the API
    const systemMsg = systemPrompt || `You are VAANI, a warm rural Indian finance advisor. Language: ${language || 'hi'}. Emotion detected: ${emotionState || 'neutral'}.
Rules:
- Respond in ${language || 'hi'} dialect using appropriate script
- Use village analogies when emotion=anxious
- Suggest FD products from Suryoday 9.1%, Utkarsh 8.5%, Jana 8.25%
- Always end with a reassuring phrase in the same language
- Never use English banking jargon
- Give rupee examples like "₹5000 se shuru karein"`;

    // Build conversation history
    const messages = [
      ...(chatHistory || []).map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
      { role: 'user', content: message },
    ];

    // Try MiniMax first (supports streaming better)
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
              { role: 'system', content: systemMsg },
              ...messages,
            ],
            stream: true,
            max_tokens: 512,
            temperature: 0.8,
          }),
        });

        if (!response.ok) {
          throw new Error(`MiniMax ${response.status}: ${await response.text()}`);
        }

        // Stream the response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

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

              let parsed;
              try {
                parsed = JSON.parse(line);
              } catch {
                // Try to extract SSE data field
                const match = line.match(/^data:\s*(.+)/);
                if (match) {
                  try { parsed = JSON.parse(match[1]); } catch { continue; }
                } else { continue; }
              }

              const content = parsed?.choices?.[0]?.delta?.content
                || parsed?.choices?.[0]?.messages?.[0]?.content
                || '';

              if (content) {
                res.write(`data: ${content}\n`);
              }
            }
          }
        } catch (streamErr) {
          console.error('[chat] Stream read error:', streamErr.message);
        }

        res.write('data: [DONE]\n');
        res.end();
        return;
      } catch (apiErr) {
        console.error('[chat] MiniMax API error:', apiErr.message);
        // Fall through to fallback
      }
    }

    // Fallback: non-streaming Gemini response
    if (GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
              generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
            }),
          }
        );

        if (!geminiRes.ok) throw new Error(`Gemini ${geminiRes.status}`);

        const data = await geminiRes.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        res.setHeader('Content-Type', 'application/json');
        res.json({ reply: text });

        // Send as stream by tokenizing
        res.setHeader('Content-Type', 'text/event-stream');
        res.flushHeaders();
        const tokens = text.split('');
        for (const token of tokens) {
          res.write(`data: ${token}\n`);
          await new Promise(r => setTimeout(r, 15));
        }
        res.write('data: [DONE]\n');
        res.end();
        return;
      } catch (geminiErr) {
        console.error('[chat] Gemini fallback error:', geminiErr.message);
      }
    }

    // Final fallback: simple pre-written response (demo mode)
    res.setHeader('Content-Type', 'text/event-stream');
    res.flushHeaders();

    const fallback = `Namaskar! Main VAANI hoon. Aapke ₹5000 se ₹20,000 tak ke liye main suggest karta hoon Suryoday mein 18 months ka FD — 9.1% return ke saath. Yeh galla jaisa fixed return aapke paise ko surakshit rakhega. Chinta mat kar, hum hain na! 💰`;

    for (const char of fallback) {
      res.write(`data: ${char}\n`);
      await new Promise(r => setTimeout(r, 18));
    }
    res.write('data: [DONE]\n');
    res.end();

  } catch (err) {
    console.error('[chat] Unhandled error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat service temporarily unavailable' });
    } else {
      res.end();
    }
  }
});

export default router;
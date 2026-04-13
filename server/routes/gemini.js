import express from 'express';

const router = express.Router();

const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';
const MINIMAX_MODEL = 'MiniMax-Text-01';

/**
 * Build the messages array for MiniMax API.
 * Merges system prompt into first user message or prepends as system role.
 */
function buildMessages(messages, systemPrompt) {
  const result = [];

  if (systemPrompt) {
    result.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of messages) {
    if (msg.role === 'user' && systemPrompt && result.length === 1 && result[0].role === 'system') {
      // Merge system into first user message
      result.push({ role: 'user', content: systemPrompt + '\n\n' + msg.content });
    } else {
      result.push({ role: msg.role, content: msg.content });
    }
  }

  return result;
}

router.post('/chat', async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'MINIMAX_API_KEY not configured on server' });
    }

    const body = {
      model: MINIMAX_MODEL,
      messages: buildMessages(messages, systemPrompt),
      max_tokens: 1024,
      temperature: 0.7,
      top_p: 0.9,
    };

    const response = await fetch(MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('MiniMax API error:', response.status, errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();

    // MiniMax returns: { choices: [{ messages: [{ role: 'assistant', content: '...' }] }] }
    const choice = data?.choices?.[0];
    const reply = choice?.messages?.[0]?.content || '';

    res.json({ reply });
  } catch (error) {
    console.error('MiniMax proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

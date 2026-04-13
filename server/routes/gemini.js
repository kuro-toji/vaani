import express from 'express';

const router = express.Router();

const MINIMAX_API_URL = 'https://api.minimax.io/v1/text/chatcompletion_v2';
const MINIMAX_MODEL = 'MiniMax-M2.7';

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

    const choice = data?.choices?.[0];
    console.log('MiniMax response choices[0]:', JSON.stringify(choice));
    // MiniMax-Text-01 OpenAI-compat: singular "message" not "messages"
    const reply = choice?.message?.content 
      || choice?.messages?.[0]?.content  // fallback for older MiniMax models
      || '';

    if (!reply) {
      console.error('Empty reply from MiniMax. Full response:', JSON.stringify(data));
      return res.status(500).json({ 
        error: 'MiniMax returned empty content',
        raw: data 
      });
    }

    res.json({ reply });
  } catch (error) {
    console.error('MiniMax proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

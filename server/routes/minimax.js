import express from 'express';

const minimaxRouter = express.Router();

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
    result.push({ role: msg.role, content: msg.content });
  }

  return result;
}

minimaxRouter.post('/chat', async (req, res) => {
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
        'Origin': 'https://api.minimax.io',
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
    console.log('[MiniMax] status:', response.status);
    console.log('[MiniMax] choice:', JSON.stringify(choice));
    const reply =
      choice?.message?.content ||          // OpenAI-compat (Text-01)
      choice?.messages?.[0]?.content ||    // Legacy MiniMax
      '';

    if (!reply) {
      console.error('[MiniMax] Empty reply. Full response:', JSON.stringify(data));
      return res.status(500).json({
        error: 'MiniMax returned empty content. Check console for raw response.',
        rawChoice: choice
      });
    }

    res.json({ reply });
  } catch (error) {
    console.error('MiniMax proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default minimaxRouter;

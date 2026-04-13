const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

/**
 * Build the Gemini-format contents array from messages + systemPrompt.
 * Gemini has no native system prompt, so we simulate it with two prepended turns.
 */
function buildContents(messages, systemPrompt) {
  const contents = [];

  if (systemPrompt) {
    contents.push(
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I am Vaani. I will follow all these instructions.' }] }
    );
  }

  for (const msg of messages) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  return contents;
}

/**
 * Try calling the local Express backend at /api/gemini/chat.
 * Returns the response text if successful, or null if the server is not running.
 */
async function tryLocalServer(messages, systemPrompt) {
  try {
    const response = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, systemPrompt }),
      signal: AbortSignal.timeout(3000), // 3s timeout — if server isn't up, fail fast
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data?.reply || data?.response || data?.text || null;
  } catch {
    // Server not running or network error — fall back to direct API
    return null;
  }
}

/**
 * Send a conversation to Gemini 1.5 Flash.
 *
 * Strategy:
 * 1. Try local Express server first (if running via npm run dev:full)
 * 2. Fall back to direct Gemini API call from the browser
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages - Conversation history.
 * @param {string} systemPrompt - System-level instructions (simulated via prepended turns).
 * @returns {Promise<string>} The model's response text.
 */
export async function sendToGemini(messages, systemPrompt) {
  // 1. Try local backend first (works if server is running)
  const localResult = await tryLocalServer(messages, systemPrompt);
  if (localResult) return localResult;

  // 2. Fall back to direct Gemini API call
  const contents = buildContents(messages, systemPrompt);

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topP: 0.9,
    },
  };

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    if (response.status === 429) {
      throw new Error(`429 Rate limit exceeded: ${errorBody}`);
    }

    throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

export default { sendToGemini };
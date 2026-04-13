/**
 * MiniMax M2.7 Service — Primary AI for Vaani chat responses.
 *
 * This file replaces Gemini but keeps the same export name (sendToGemini)
 * so no other file in the codebase needs to change.
 *
 * MiniMax uses an OpenAI-compatible messages format with native system role.
 */

const MINIMAX_API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';
const MINIMAX_API_KEY = import.meta.env.VITE_MINIMAX_API_KEY;

/**
 * Build the MiniMax messages array from conversation + systemPrompt.
 * MiniMax supports a native system role — no need to fake it.
 */
function buildMessages(messages, systemPrompt) {
  const result = [];

  if (systemPrompt) {
    result.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of messages) {
    result.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    });
  }

  return result;
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
 * Send a conversation to MiniMax M2.7.
 *
 * Strategy:
 * 1. Try local Express server first (if running via npm run dev:full)
 * 2. Fall back to direct MiniMax API call from the browser
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages - Conversation history.
 * @param {string} systemPrompt - System-level instructions.
 * @returns {Promise<string>} The model's response text.
 */
export async function sendToGemini(messages, systemPrompt) {
  // 1. Try local backend first (works if server is running)
  const localResult = await tryLocalServer(messages, systemPrompt);
  if (localResult) return localResult;

  // 2. Fall back to direct MiniMax API call
  const body = {
    model: 'MiniMax-Text-01',
    messages: buildMessages(messages, systemPrompt),
    max_tokens: 1024,
    temperature: 0.7,
    top_p: 0.9,
  };

  const response = await fetch(MINIMAX_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    if (response.status === 429) {
      throw new Error(`429 Rate limit exceeded: ${errorBody}`);
    }

    throw new Error(`MiniMax API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('MiniMax returned an empty response');
  }

  return text;
}

export default { sendToGemini };
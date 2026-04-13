/**
 * MiniMax Service — All requests go through the local Express backend.
 * The server proxies to api.minimax.io with the proper API key.
 */

function stripThinkingTags(text) {
  if (!text) return text;
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

const API_URL = '/api/minimax/chat';

/**
 * Send a conversation to MiniMax via the local Express server.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages - Conversation history.
 * @param {string} systemPrompt - System-level instructions.
 * @returns {Promise<string>} The model's response text.
 */
export async function sendToMiniMax(messages, systemPrompt) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt }),
    signal: AbortSignal.timeout(10000), // 10s timeout
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Server error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  if (data?.error) {
    throw new Error(data.error);
  }

  const text = stripThinkingTags(data?.reply);
  if (!text) {
    throw new Error('MiniMax returned empty content');
  }

  return text;
}

export default { sendToMiniMax };

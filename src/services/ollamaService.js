/**
 * Ollama Service - Local AI fallback for Vaani
 * Runs entirely on your machine, no API calls, no rate limits
 */

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const MODEL = 'llama3.2:1b';

export async function sendToOllama(messages, systemPrompt) {
  // Build conversation string from messages
  const conversation = messages.map(m => {
    const role = m.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${m.content}`;
  }).join('\n');

  const fullPrompt = `${systemPrompt}

CONVERSATION HISTORY:
${conversation}

Respond as Vaani following all the instructions above.`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Ollama error:', error);
    throw error;
  }
}

export async function isOllamaAvailable() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2s timeout — fail fast if not running
    });
    return response.ok;
  } catch {
    return false;
  }
}
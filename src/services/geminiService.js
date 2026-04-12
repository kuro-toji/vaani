// Cache for API responses — keyed by hash of messages + system prompt
const responseCache = new Map();

function getCacheKey(messages, systemPrompt) {
  // Create a simple hash from the conversation
  const conversation = messages.map(m => `${m.role}:${m.content}`).join('|');
  const promptHash = systemPrompt.substring(0, 100); // First 100 chars of system prompt
  return `${promptHash}|${conversation}`;
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

const sendToGemini = async (messages, systemPrompt) => {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`;

  // Check cache before making API call
  const cacheKey = getCacheKey(messages, systemPrompt);
  if (responseCache.has(cacheKey)) {
    console.log('Returning cached response');
    return responseCache.get(cacheKey);
  }

  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood. I am Vaani. I will follow all these instructions exactly.' }] },
    ...messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
  ];

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.9,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sorry, I could not generate a response. Please try again.';
  
  // Cache successful responses (but not error responses)
  if (text && !text.includes('could not generate')) {
    responseCache.set(cacheKey, text);
  }
  
  // Clear oldest entries if cache gets too big (keep last 50)
  if (responseCache.size > 50) {
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  
  return text;
};

export { sendToGemini };

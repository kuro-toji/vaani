const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const responseCache = new Map();

export async function sendToGemini(prompt, language = 'hi') {
  // Check cache
  const cacheKey = `${prompt.substring(0, 100)}-${language}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey);
  }

  try {
    const response = await fetch(`${API_BASE}/api/gemini/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, language }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API error');
    }

    const data = await response.json();
    
    // Cache successful response
    if (data.text && !data.text.includes('could not generate')) {
      responseCache.set(cacheKey, data.text);
      // Evict oldest if over 50 entries
      if (responseCache.size > 50) {
        const firstKey = responseCache.keys().next().value;
        responseCache.delete(firstKey);
      }
    }

    return data.text;
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export default { sendToGemini };
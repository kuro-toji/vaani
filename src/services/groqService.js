/**
 * Groq STT Service - Free OpenAI-compatible Whisper API
 * Free tier: 30 requests/min, 14,400 requests/day
 */

export async function transcribeWithGroq(audioBlob, languageHint = 'auto') {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: 'Groq API key not set. Add VITE_GROQ_API_KEY to .env' };
  }

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    if (languageHint !== 'auto') {
      formData.append('language', mapToGroqLanguage(languageHint));
    }

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error?.message || `API error ${response.status}` };
    }

    const data = await response.json();
    return { success: true, text: data.text };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function mapToGroqLanguage(langCode) {
  const map = {
    hi: 'hi', bn: 'bn', te: 'te', ta: 'ta', mr: 'mr',
    ur: 'ur', gu: 'gu', kn: 'kn', ml: 'ml', pa: 'pa',
    or: 'or', ne: 'ne', as: 'as', en: 'en'
  };
  return map[langCode] || 'auto';
}

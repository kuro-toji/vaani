/**
 * Groq STT Service — Direct browser-to-Groq API calls.
 *
 * Uses Groq's Whisper endpoint for cloud speech-to-text.
 * Falls back gracefully if no API key is configured.
 */

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

/**
 * Check if Groq API key is configured.
 */
export function isGroqConfigured() {
  return !!(API_KEY && API_KEY.length > 0 && API_KEY !== 'your_groq_key_here');
}

/**
 * Transcribe audio using Groq's Whisper Large V3 API.
 *
 * @param {Blob} audioBlob - Audio blob (webm/opus or similar)
 * @param {string} language - Language code (hi, bn, ta, etc.)
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeWithGroq(audioBlob, language = 'hi') {
  if (!isGroqConfigured()) {
    console.warn('Groq API key not configured. Skipping cloud STT.');
    throw new Error('Groq not configured');
  }

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('model', 'whisper-large-v3');
  formData.append('language', language);

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Groq STT error ${response.status}: ${errText.substring(0, 100)}`);
  }

  const data = await response.json();
  return data.text || '';
}

export default { transcribeWithGroq, isGroqConfigured };
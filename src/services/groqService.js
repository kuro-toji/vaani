/**
 * Groq STT Service — Proxied through our server to hide API key.
 * Server calls Groq Whisper API with server-side key.
 */

const API_ENDPOINT = (import.meta.env.VITE_API_URL || 'https://vaani-exhg.onrender.com') + '/api/stt/transcribe';

/**
 * Check if STT proxy is available.
 */
export function isGroqConfigured() {
  return true; // Server handles key — always available when server is up
}

/**
 * Transcribe audio via our server proxy.
 *
 * @param {Blob} audioBlob - Audio blob
 * @param {string} language - Language code
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeWithGroq(audioBlob, language = 'hi') {
  // Convert blob to base64
  const reader = new FileReader();
  const base64Promise = new Promise((resolve, reject) => {
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
  reader.readAsDataURL(audioBlob);
  const base64Audio = await base64Promise;

  const GROQ_LANG_MAP = {
    hi: 'hi', bn: 'bn', te: 'te', ta: 'ta', mr: 'mr',
    ur: 'ur', gu: 'gu', kn: 'kn', ml: 'ml', pa: 'pa',
    or: 'or', ne: 'ne', as: 'as', en: 'en',
    mai: 'hi', bho: 'hi', raj: 'hi', hne: 'hi', bgc: 'hi',
    mag: 'hi', kok: 'hi', dgo: 'hi', brx: 'hi', mni: 'hi',
    sa: 'hi', tcy: 'kn', ks: 'ur', sd: 'ur', sat: null,
  };
  const groqLang = GROQ_LANG_MAP[language] ?? null;
  const body = { audio: base64Audio };
  if (groqLang) body.language = groqLang;

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`STT error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.text || '';
}

export default { transcribeWithGroq, isGroqConfigured };

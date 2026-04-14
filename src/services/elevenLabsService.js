/**
 * ElevenLabs TTS Service — Proxied through our server to hide API key.
 *
 * Uses eleven_multilingual_v2 model which supports Hindi, Tamil, Telugu,
 * Bengali, Marathi, Gujarati, Kannada, Malayalam, and many more.
 * Falls back silently to Web Speech API on any error.
 */

// One consistent multilingual voice for all Indian languages.
// The eleven_multilingual_v2 model handles accent/language automatically.
const VOICE_IDS = {
  hi: 'EXAVITQu4vr4xnSDxMaL',
  ta: 'EXAVITQu4vr4xnSDxMaL',
  te: 'EXAVITQu4vr4xnSDxMaL',
  bn: 'EXAVITQu4vr4xnSDxMaL',
  mr: 'EXAVITQu4vr4xnSDxMaL',
  gu: 'EXAVITQu4vr4xnSDxMaL',
  kn: 'EXAVITQu4vr4xnSDxMaL',
  ml: 'EXAVITQu4vr4xnSDxMaL',
  pa: 'EXAVITQu4vr4xnSDxMaL',
  en: 'EXAVITQu4vr4xnSDxMaL',
  default: 'EXAVITQu4vr4xnSDxMaL',
};

/**
 * Check if TTS proxy is available.
 * Returns true — server handles the API key.
 */
export function isElevenLabsConfigured() {
  return true; // Server TTS proxy always available
}

/**
 * Speak text via our server proxy (hides API key).
 *
 * @param {string} text - Text to speak
 * @param {string} language - Language code (hi, ta, te, bn, etc.)
 * @returns {Promise<void>} Resolves when audio finishes playing
 */
export async function speakWithElevenLabs(text, language = 'hi') {
  if (!text) {
    throw new Error('No text provided');
  }

  // Use server proxy — hides API key
  const response = await fetch((import.meta.env.VITE_API_URL || 'https://vaani-exhg.onrender.com') + '/api/tts/speak', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice_id: VOICE_IDS[language] || VOICE_IDS.default }),
  });

  if (!response.ok) {
    throw new Error(`TTS error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const audio = new Audio(objectUrl);
    audio.onended = () => { URL.revokeObjectURL(objectUrl); resolve(); };
    audio.onerror = (err) => { URL.revokeObjectURL(objectUrl); reject(err); };
    audio.play().catch((err) => { URL.revokeObjectURL(objectUrl); reject(err); });
  });
}

export default { speakWithElevenLabs, isElevenLabsConfigured };

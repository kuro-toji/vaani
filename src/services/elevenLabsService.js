/**
 * ElevenLabs TTS Service — Direct browser-to-API calls.
 *
 * Uses eleven_multilingual_v2 model which supports Hindi, Tamil, Telugu,
 * Bengali, Marathi, Gujarati, Kannada, Malayalam, and many more.
 * Falls back silently to Web Speech API on any error.
 */

const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || '';

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

// Pre-recorded MP3s handle greetings; browser TTS for all chat.
let elevenLabsExhausted = true;

/**
 * Check if ElevenLabs API key is configured.
 * Always returns false since pre-recorded MP3s handle greetings
 * and browser TTS handles all chat responses.
 */
export function isElevenLabsConfigured() {
  return false; // ElevenLabs not used — pre-recorded audio + browser TTS only
}

/**
 * Speak text using ElevenLabs API directly from the browser.
 *
 * @param {string} text - Text to speak
 * @param {string} language - Language code (hi, ta, te, bn, etc.)
 * @returns {Promise<void>} Resolves when audio finishes playing
 */
export async function speakWithElevenLabs(text, language = 'hi') {
  if (!text || !isElevenLabsConfigured()) {
    throw new Error('ElevenLabs not configured');
  }

  const voiceId = VOICE_IDS[language] || VOICE_IDS.default;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
  const objectUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const audio = new Audio(objectUrl);

    audio.onended = () => {
      URL.revokeObjectURL(objectUrl);
      resolve();
    };

    audio.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    audio.play().catch((err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    });
  });
}

export default { speakWithElevenLabs, isElevenLabsConfigured };
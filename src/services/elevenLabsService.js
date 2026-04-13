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
  hi: 'pFZP5JQG7iVDjFUM49ud',
  ta: 'pFZP5JQG7iVDjFUM49ud',
  te: 'pFZP5JQG7iVDjFUM49ud',
  bn: 'pFZP5JQG7iVDjFUM49ud',
  mr: 'pFZP5JQG7iVDjFUM49ud',
  gu: 'pFZP5JQG7iVDjFUM49ud',
  kn: 'pFZP5JQG7iVDjFUM49ud',
  ml: 'pFZP5JQG7iVDjFUM49ud',
  pa: 'pFZP5JQG7iVDjFUM49ud',
  en: 'pFZP5JQG7iVDjFUM49ud',
  default: 'pFZP5JQG7iVDjFUM49ud',
};

/**
 * Check if ElevenLabs API key is configured and valid.
 * Used by useVoice to decide whether to try ElevenLabs before Web Speech API.
 */
export function isElevenLabsConfigured() {
  return !!(
    API_KEY &&
    API_KEY.length > 0 &&
    API_KEY !== 'your_elevenlabs_api_key_here' &&
    API_KEY !== 'your_elevenlabs_key_here'
  );
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
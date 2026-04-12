/**
 * ElevenLabs TTS Service
 * High-quality emotional text-to-speech for Indian languages
 * Free tier: 10,000 characters/month
 */

const VOICE_IDS = {
  // Hindi voices
  hi: 'zR9mCjJy4TTpMFUMINP7', // Akshay (Male) - warm, friendly
  // Bengali
  bn: 'nPCSutJNnxQ1ThKleX6r', // Bashabi (Female)
  // Tamil
  ta: 'GQnfS45Cu1SmJzBzRj3k', // Muthu (Male)
  // Telugu
  te: 'CYzpKBrGjUcpSMMG3M5F', // Charan (Male)
  // Marathi
  mr: 'M5L4dRJ5kMBJGEfQWNtG', // Amit (Male)
  // Gujarati
  gu: 'NJyvd1I1sRpJN0GLr5l6', // Miraj (Male),
  // Kannada
  kn: 'O0NYEGO29TprNZqjyJKE', // Ganesha (Male),
  // Malayalam
  ml: 'K2pJvlAHz7bjnWzjXkFJ', // Vishnu (Male),
  // Odia
  or: 'G0lOdYQCNGEYlLl3pJl3', // Kishore (Male),
  // Punjabi
  pa: 'eMxbK1lF1lW3aWbCNPiG', // Amrit (Male),
  // Urdu
  ur: '1Z7LKGlI5H2tJ8pOc3k6', // Faizan (Male),
  // English
  en: 'pFZP7FGaGmWlbQbQfF2F', // Daniel (American Male),
};

// ElevenLabs voice settings for emotional, natural speech
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.5,
  use_speaker_boost: true,
};

export async function speakWithElevenLabs(text, language = 'hi') {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  const voiceId = VOICE_IDS[language] || VOICE_IDS['hi'];
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=4`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          voice_settings: VOICE_SETTINGS,
          model_id: 'eleven_multilingual_v2',
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.detail?.message || `ElevenLabs error: ${response.status}`);
    }

    return response.arrayBuffer();
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    throw error;
  }
}

export function isElevenLabsConfigured() {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  return apiKey && apiKey !== 'your_elevenlabs_api_key_here' && apiKey.length > 10;
}

export default { speakWithElevenLabs, isElevenLabsConfigured };

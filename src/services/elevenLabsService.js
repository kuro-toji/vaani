/**
 * ElevenLabs TTS Service
 * High-quality emotional text-to-speech for Indian languages
 * Free tier: 10,000 characters/month
 */

const VOICE_IDS = {
  // Hindi - voices that support Hindi via multilingual model
  hi: 'JBFqnCBsd6RMkjVDRZzb', // George (male, british) - warm, friendly
  // Bengali - use Hindi-supporting voice
  bn: 'EXAVITQu4vr4xnSDxMaL', // Sarah (female) - clear, warm
  // Tamil
  ta: 'TX3LPaxmHKxFdv7VOQHJ', // Liam (male) - neutral
  // Telugu
  te: 'cgSgspJ2msm6clMCkdW9', // Jessica (female) - clear
  // Marathi
  mr: 'JBFqnCBsd6RMkjVDRZzb', // George (male) - same
  // Gujarati
  gu: 'JBFqnCBsd6RMkjVDRZzb', // George (male) - same
  // Kannada
  kn: 'JBFqnCBsd6RMkjVDRZzb', // George (male) - same
  // Malayalam
  ml: 'TX3LPaxmHKxFdv7VOQHJ', // Liam (male) - same
  // Odia
  or: 'JBFqnCBsd6RMkjVDRZzb', // George (male) - same
  // Punjabi
  pa: 'JBFqnCBsd6RMkjVDRZzb', // George (male) - same
  // Urdu
  ur: 'JBFqnCBsd6RMkjVDRZzb', // George (male) - same
  // English
  en: 'JBFqnCBsd6RMkjVDRZzb', // George (male) - same
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

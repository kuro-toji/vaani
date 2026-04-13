const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const VOICE_IDS = {
  hi: '21m00Tcm4TlvDq8ikHAM', // Hindi
  en: 'pFZP5JQG7iVDjFUM49udMUbX', // English
  default: '21m00Tcm4TlvDq8ikHAM',
};

export async function speakWithElevenLabs(text, language = 'hi') {
  const voiceId = VOICE_IDS[language] || VOICE_IDS.default;

  const response = await fetch(`${API_BASE}/api/tts/speak`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, voice_id: voiceId }),
  });

  if (!response.ok) {
    throw new Error('TTS failed');
  }

  const audioBuffer = await response.arrayBuffer();
  return audioBuffer;
}

export function isElevenLabsConfigured() {
  // We assume backend has the key if server is running
  return true;
}

export default { speakWithElevenLabs, isElevenLabsConfigured };
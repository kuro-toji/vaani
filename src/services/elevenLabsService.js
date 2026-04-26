/**
 * elevenLabsService — ElevenLabs premium TTS proxy.
 * Used only when user enables premium voice (vaani_premium_voice = '1').
 */
export function isElevenLabsConfigured() {
  return !!import.meta.env.VITE_ELEVENLABS_API_KEY;
}

/**
 * Speak text with ElevenLabs voice.
 * Chunks text into 400-char segments and speaks sequentially.
 */
export async function speakWithElevenLabs(text, language = 'hi') {
  if (!text || !isElevenLabsConfigured()) return;
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  const voiceMap = {
    hi: 'h在心里', bn: 'bn', te: 'te-IN', ta: 'ta-IN', mr: 'mr-IN',
    gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', en: '21m00Tcm4GNu8eol5',
  };
  const voiceId = voiceMap[language] || '21m00Tcm4GNu8eol5';
  const chunks = text.match(/.{1,400}/g) || [text];
  for (const chunk of chunks) {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: chunk,
            model_id: 'eleven_monolingual_v1',
            voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          }),
        }
      );
      if (!res.ok) continue;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await new Promise((resolve) => { audio.onended = resolve; audio.play(); });
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('[ElevenLabs] TTS error:', e.message);
    }
  }
}

export default { speakWithElevenLabs, isElevenLabsConfigured };
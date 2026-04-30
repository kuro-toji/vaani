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

  // All Indian languages use the multilingual v2 model
  // These are valid ElevenLabs voice IDs that support Hindi/Indian languages
  const voiceMap = {
    hi:  'pNInz6obpgDQGcFmaJgB',  // Adam — multilingual, warm male
    en:  'EXAVITQu4vr4xnSDxMaL',  // Bella — clear female
    bn:  'pNInz6obpgDQGcFmaJgB',
    te:  'pNInz6obpgDQGcFmaJgB',
    ta:  'pNInz6obpgDQGcFmaJgB',
    mr:  'pNInz6obpgDQGcFmaJgB',
    gu:  'pNInz6obpgDQGcFmaJgB',
    kn:  'pNInz6obpgDQGcFmaJgB',
    ml:  'pNInz6obpgDQGcFmaJgB',
    pa:  'pNInz6obpgDQGcFmaJgB',
    ur:  'pNInz6obpgDQGcFmaJgB',
    default: 'pNInz6obpgDQGcFmaJgB',
  };
  const voiceId = voiceMap[language] || voiceMap.default;

  // Split by sentence boundaries (not arbitrary 400 chars)
  const sentences = text.split(/(?<=[.!?।])\s+/);
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > 350 && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current = current ? current + ' ' + s : s;
    }
  }
  if (current) chunks.push(current.trim());
  if (chunks.length === 0) chunks.push(text);
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
            model_id: 'eleven_multilingual_v2',
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
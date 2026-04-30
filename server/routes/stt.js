import express from 'express';
const router = express.Router();

// ═══════════════════════════════════════════════════════════════════
// STT Route — Gemini Primary + Groq Whisper Failover
// ═══════════════════════════════════════════════════════════════════

const BCP47_MAP = {
  hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN',
  gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'or-IN',
  ur: 'ur-IN', en: 'en-IN', as: 'as-IN', mni: 'mni-IN', bho: 'hi-IN',
};

// ─── Gemini STT (Primary) ────────────────────────────────────────
async function transcribeWithGemini(audioBuffer, language) {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set');

  const base64Audio = audioBuffer.toString('base64');
  const bcp47 = BCP47_MAP[language] || 'hi-IN';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: 'audio/webm', data: base64Audio } },
            { text: `Transcribe this audio accurately. The speaker is likely speaking ${language === 'en' ? 'English' : 'an Indian language (' + bcp47 + ')'}. Return ONLY the transcribed text, nothing else. If the audio is silent or unclear, return an empty string.` }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    const status = response.status;
    console.error(`[Gemini STT] Error ${status}:`, errText);
    throw { status, message: `Gemini STT failed: ${status}`, provider: 'gemini' };
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  console.log(`[Gemini STT] ✓ Transcribed (${language}): "${text.substring(0, 60)}..."`);
  return { text, provider: 'gemini' };
}

// ─── Groq Whisper STT (Failover) ─────────────────────────────────
async function transcribeWithGroq(audioBuffer, language) {
  const GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) throw new Error('GROQ_API_KEY not set');

  const formData = new FormData();
  formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('language', language || 'hi');
  formData.append('response_format', 'verbose_json');
  formData.append('temperature', '0.0');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GROQ_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Groq STT] Error ${response.status}:`, errText);
    throw new Error(`Groq STT failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`[Groq STT] ✓ Transcribed (${language}): "${(data.text || '').substring(0, 60)}..."`);
  return { text: data.text || '', provider: 'groq', detectedLanguage: data.language };
}

// ─── STT Endpoint with Failover ──────────────────────────────────
router.post('/transcribe', async (req, res) => {
  try {
    const { audio, language } = req.body;
    if (!audio) return res.status(400).json({ error: 'Audio data required' });

    const audioBuffer = Buffer.from(audio, 'base64');
    let result;

    // Try Gemini first
    try {
      result = await transcribeWithGemini(audioBuffer, language || 'hi');
    } catch (geminiError) {
      const status = geminiError?.status || 500;
      console.warn(`[STT] Gemini failed (${status}), falling back to Groq...`);

      // Failover to Groq on 429 (rate limit) or 5xx (server error)
      if (status === 429 || status >= 500 || !process.env.GEMINI_API_KEY) {
        try {
          result = await transcribeWithGroq(audioBuffer, language || 'hi');
        } catch (groqError) {
          console.error('[STT] Both providers failed');
          throw groqError;
        }
      } else {
        throw geminiError;
      }
    }

    res.json({
      text: result.text,
      provider: result.provider,
      detectedLanguage: result.detectedLanguage || language,
    });

  } catch (error) {
    console.error('[STT] Error:', error.message || error);
    res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

export default router;
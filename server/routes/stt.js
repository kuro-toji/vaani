import express from 'express';
const router = express.Router();

router.post('/transcribe', async (req, res) => {
  try {
    const { audio, language } = req.body;
    
    if (!audio) {
      return res.status(400).json({ error: 'Audio data required' });
    }

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'Groq API key not configured' });
    }

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', language || 'hi');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    res.json({ text: data.text || '' });
  } catch (error) {
    console.error('STT error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
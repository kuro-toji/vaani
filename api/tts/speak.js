export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voice_id } = req.body;

  try {
    const response = await fetch('https://vaani-px64.onrender.com/api/tts/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice_id }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: await response.text() });
    }

    const buffer = await response.arrayBuffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.byteLength,
      'Cache-Control': 'public, max-age=31536000',
    });
    res.send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

import express from 'express';
const router = express.Router();

router.post('/scan', async (req, res) => {
  try {
    const { image, type } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Image data required' });
    }

    const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
    
    if (!MINIMAX_API_KEY) {
      return res.status(500).json({ error: 'MiniMax API key not configured' });
    }

    const response = await fetch('https://api.minimax.io/v1/reasoning/ocr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({ 
        model: 'ocr-pro',
        image_url: image,
        type: type || 'passbook'
      }),
    });

    if (!response.ok) {
      throw new Error(`OCR error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
import express from 'express';
import { franc } from 'franc-min';

const router = express.Router();

// Language code mapping
const francToCode = {
  'hin': 'hi',
  'eng': 'en',
  'ben': 'bn',
  'tam': 'ta',
  'tel': 'te',
  'mar': 'mr',
  'guj': 'gu',
  'kan': 'kn',
  'mal': 'ml',
  'pan': 'pa',
  'odi': 'or',
  'asm': 'as',
  'urd': 'ur',
};

router.post('/language', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.length < 2) {
      return res.json({ language: 'hi' });
    }

    // Detect language using franc
    const detected = franc(text, { minLength: 3 });
    const code = francToCode[detected] || 'hi';
    
    res.json({ language: code });
  } catch (error) {
    console.error('Language detection error:', error);
    res.json({ language: 'hi' }); // Default to Hindi
  }
});

export default router;

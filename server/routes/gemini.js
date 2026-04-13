import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', async (req, res) => {
  try {
    const { prompt, language } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: `You are Vaani, a helpful financial assistant for Indian users. 
        Respond in ${language || 'Hindi'} (use Hindi script). 
        Keep responses simple and accessible.`
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, text });
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

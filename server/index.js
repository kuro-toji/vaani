import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import geminiRoute from './routes/gemini.js';
import ttsRoute from './routes/tts.js';
import detectRoute from './routes/detect.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/gemini', geminiRoute);
app.use('/api/tts', ttsRoute);
app.use('/api/detect', detectRoute);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`VAANI Server running on port ${PORT}`);
});

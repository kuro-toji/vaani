import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import minimaxRoute from './routes/minimax.js';
import chatRoute from './routes/chat.js';
import ttsRoute from './routes/tts.js';
import detectRoute from './routes/detect.js';
import sttRoute from './routes/stt.js';
import ocrRoute from './routes/ocr.js';
import leadsRoute from './routes/leads.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

// ── Security Headers (CSP, HSTS, X-Frame-Options, etc.) ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'https://api.groq.com', 'https://api.minimax.chat', 'https://api.elevenlabs.io'],
      mediaSrc: ["'self'", 'blob:'],
      imgSrc: ["'self'", 'data:', 'blob:'],
    },
  },
  crossOriginEmbedderPolicy: false, // needed for audio/media
}));

// ── CORS (restricted origins) ──
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// ── Rate Limiting ──
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a few minutes before trying again.' },
});
app.use('/api/', apiLimiter);

// Stricter limit for expensive AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 AI calls per minute per IP
  message: { error: 'AI rate limit reached. Please slow down.' },
});
app.use('/api/minimax', aiLimiter);
app.use('/api/tts', aiLimiter);
app.use('/api/stt', aiLimiter);

// ── Body parsing with size limits ──
app.use(express.json({ limit: '2mb' }));

// ── Request logging (basic) ──
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api/')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// Routes
app.use('/api/minimax', minimaxRoute);
app.use('/api/chat', chatRoute);
app.use('/api/tts', ttsRoute);
app.use('/api/detect', detectRoute);
app.use('/api/stt', sttRoute);
app.use('/api/ocr', ocrRoute);
app.use('/api/leads', leadsRoute);

// ── Input validation error handler ──
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large. Maximum 2MB.' });
  }
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }
  console.error('Server error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`VAANI Server running on port ${PORT}`);
  console.log(`Rate limits: 100 req/15min (general), 10 req/min (AI endpoints)`);
});

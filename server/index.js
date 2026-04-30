import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { initSocket } from './socket.js';
import minimaxRoute from './routes/minimax.js';
import chatRoute from './routes/chat.js';
import ttsRoute from './routes/tts.js';
import detectRoute from './routes/detect.js';
import sttRoute from './routes/stt.js';
import ocrRoute from './routes/ocr.js';
import leadsRoute from './routes/leads.js';
import marketDataRoute from './routes/market-data.js';
import taxEngineRoute from './routes/tax-engine.js';
import subscriptionsRoute from './routes/subscriptions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:4173'];

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// ── Supabase Helper ──
async function logAPI(req, res, provider = null) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    await supabase.from('api_logs').insert({
      endpoint: req.path,
      user_id_hash: req.body?.userId?.slice(0, 20) || null,
      response_time_ms: Date.now() - (req._startTime || Date.now()),
      ai_provider: provider,
      success: res.statusCode < 400,
      error_code: res.statusCode >= 400 ? res.statusCode.toString() : null,
    });
  } catch (e) {
    console.warn('[API Log] Failed to log:', e.message);
  }
}

// ── Security Headers ──
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://*.huggingface.co"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      connectSrc: ["'self'", "ws://localhost:*", "wss://localhost:*", "https://api.groq.com", "https://api.minimax.chat", "https://api.minimax.io", "https://api.elevenlabs.io", "https://generativelanguage.googleapis.com", "http://localhost:*", "https://*.supabase.co", "https://*.supabase.io"],
      workerSrc: ["'self'", "blob:"],
      mediaSrc: ["'self'", "blob:"],
      imgSrc: ["'self'", "data:", "blob:"],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──
app.use(cors({
  origin: (origin, callback) => {
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
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a few minutes.' },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'AI rate limit reached. Please slow down.' },
});

app.use('/api/', apiLimiter);
app.use('/api/minimax', aiLimiter);
app.use('/api/tts', aiLimiter);
app.use('/api/stt', aiLimiter);

// ── Body parsing ──
app.use(express.json({ limit: '2mb' }));

// ── Request logging + observability ──
app.use((req, res, next) => {
  req._startTime = Date.now();
  res.on('finish', async () => {
    const duration = Date.now() - req._startTime;
    if (req.path.startsWith('/api/')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
      
      // Log to API logs table for observability (Layer 10)
      if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        await logAPI(req, res, null);
      }
    }
  });
  next();
});

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ── API Routes ──
app.use('/api/minimax', minimaxRoute);
app.use('/api/chat', chatRoute);
app.use('/api/tts', ttsRoute);
app.use('/api/detect', detectRoute);
app.use('/api/stt', sttRoute);
app.use('/api/ocr', ocrRoute);
app.use('/api/leads', leadsRoute);

// ── Layer 1: Market Data (FD rates, NAV cache, crypto prices) ──
app.use('/api/market', marketDataRoute);

// ── Layer 4: Tax Engine (real computation) ──
app.use('/api/tax', taxEngineRoute);

// ── Layer 9: Subscriptions (Razorpay) ──
app.use('/api/subscriptions', subscriptionsRoute);

// ── Error handler ──
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

// ── HTTP + Socket.io server ──
const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`VAANI Server + Socket.io running on port ${PORT}`);
  console.log(`Rate limits: 100 req/15min (general), 10 req/min (AI endpoints)`);
  console.log(`Routes: /api/chat, /api/market, /api/tax, /api/subscriptions`);
});
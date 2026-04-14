# Vaani — India's Voice-First Financial Advisor

> Financial inclusion for India's next 800 million — in your language, by your voice.

**Vaani** is a voice-first financial advisor that works in 22 Indian languages. No forms, no typing, no English required. Just speak and discover government schemes, compare FD rates, check eligibility, and get a personalized financial health score.

## Features

### Government Schemes (12 schemes)
- **PM Kisan** — ₹6,000/year to farmer families
- **Sukanya Samriddhi** — 7.6% tax-free savings for daughters
- **Jan Dhan** — Zero-balance account with ₹50,000 insurance
- **PMJJBY** — ₹436/year term life insurance (₹2 lakh cover)
- **PMSBY** — ₹20/year accident insurance (₹2 lakh cover)
- **Atal Pension** — ₹3,000-5,000/month guaranteed pension
- **PM Awas Yojana** — ₹1.20 lakh housing subsidy
- **MUDRA Loans** — Up to ₹10 lakh for small traders
- **Stand Up India** — ₹10 lakh-1 crore for SC/ST and women entrepreneurs
- **Kaushal Vikas** — Free skill training with job placement
- **PM Vidyarthi** — Education loan at subsidized rate
- **NPS** — Voluntary pension with EEE tax status

All schemes include: bilingual descriptions (hi/en), eligibility criteria, required documents, application modes, official websites, and keyword tags for natural language search.

### FD Rate Comparator
Compare fixed deposit rates from **SBI, HDFC, ICICI, PNB, Bank of Baroda, Axis, Kotak, India Post** — ranked by rate. Includes senior citizen rates, tenure-specific rates, and Post Office special schemes (MIS, RD, Monthly Income).

### Eligibility Checker
Conversational 2-3 question flows for insurance, pension, loan, and savings schemes. Auto-detects user profile from conversation (age, gender, occupation, income).

### Bank & CSC Locator
Find nearest banks and Common Service Centres by pincode. Returns branch phone numbers, websites, and application instructions in your language.

### Proactive Scheme Matcher
Profile-based scheme discovery — not reactive search. Takes user profile (age, gender, occupation, income, state, bank account status) and returns top 3 matching schemes with match scores and specific reasons.

### Life-Event Investment Ladder
Detects major life events (marriage, education, harvest, emergency, retirement) from conversation and generates a contextual investment allocation plan with instruments and timelines.

### VAANI Score
Financial health score (0-100) computed from conversation history across 5 pillars:
- Emergency Fund (20 pts)
- Insurance Coverage (20 pts)
- Active Investments (20 pts)
- Savings Rate (20 pts)
- Debt Health (20 pts)

Includes level classification (excellent/good/fair/needs-work) and Hindi advice.

### Micro-Nudge Savings
Generates friendly voice-ready nudges to encourage saving small amounts (₹20-100). Detects idle balance, calculates savings potential vs. ideal 20% rate, and suggests micro-SIP starting points.

### Lead Capture
Captures user interest for B2B financial product partnerships. Includes phone validation, name sanitization, product interest detection, and admin auth for data retrieval.

### Voice-First UX
- **22 Indian languages** with auto-detection from voice
- **Browser Web Speech API** for free unlimited TTS
- **ElevenLabs** (optional premium voice)
- **Groq Whisper** for cloud speech-to-text
- **Local Whisper** (Xenova/transformers) for offline STT
- Pre-recorded Hindi/English welcome greetings (zero API cost)
- 5-second push-to-talk countdown

### Accessibility
- Large text mode (CSS variables, no layout break)
- High contrast mode
- Vibration feedback on mobile (haptic tap-to-talk)
- Keyboard navigation

### PWA & Offline
- Installable on mobile/desktop
- Service worker caches all assets
- Offline-capable after first load

### OCR Document Scanner
Passbook/bank statement scanning via MiniMax OCR Pro (server-side proxy).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| AI/ML | MiniMax M2.7 (chat), Groq Whisper (STT), Xenova/transformers (local Whisper) |
| Voice | Browser Web Speech API, ElevenLabs, Franc (language detection) |
| Backend | Express.js, Helmet, express-rate-limit, cors |
| Data | React Context + hooks (no Redux) |
| Deployment | Vercel (frontend), Render (backend) |

## Architecture

```
Frontend (React/Vite)          Backend (Express.js)
─────────────────────          ───────────────────
src/
├── components/          server/
├── context/             ├── routes/
├── hooks/              │   ├── minimax.js    # MiniMax proxy
│   ├── useChat.js      │   ├── leads.js     # Lead capture
│   ├── useVoice.js     │   ├── stt.js       # Groq Whisper proxy
│   └── useLandingVoice │   ├── tts.js       # ElevenLabs proxy
├── data/               │   ├── detect.js    # Language detection
│   ├── schemes.js      │   └── ocr.js       # Document scanning
│   ├── fdRates.js      └── index.js
├── pages/
└── services/
    ├── minimaxService.js
    ├── profileMatcher.js    # Proactive scheme matching
    ├── vaaniScoreService.js # Financial health score
    ├── lifeEventService.js  # Life-event detection
    ├── microNudgeService.js # Savings nudges
    ├── eligibilityService.js
    ├── leadService.js
    ├── locatorService.js     # Bank/CSC finder
    └── languageDetector.js
```

## Quick Start

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install

# Start development (frontend + backend)
npm run dev:full

# Build for production
npm run build
```

**Frontend:** http://localhost:5173
**Backend:** http://localhost:3001

## Environment Variables

### Frontend (.env)
```
VITE_MINIMAX_API_KEY=your_minimax_key
VITE_GROQ_API_KEY=your_groq_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key  # optional
VITE_API_URL=http://localhost:3001
```

### Backend (server/.env)
```
MINIMAX_API_KEY=your_minimax_key
GROQ_API_KEY=your_groq_key
ELEVENLABS_API_KEY=your_elevenlabs_key
PORT=3001
CORS_ORIGINS=https://your-frontend.vercel.app
```

### API Keys
- **MiniMax:** https://platform.minimaxi.chat
- **Groq:** https://console.groq.com/keys
- **ElevenLabs:** https://elevenlabs.io (free tier: 10k chars/month)

## Security

- API keys proxied through backend (never exposed in browser)
- CSP headers via Helmet
- Rate limiting on all API routes
- Phone validation + name sanitization on lead capture
- Lead data requires admin auth header
- Only 200 responses cached in service worker (no 206 partials)

## License

MIT — Built for Bharat

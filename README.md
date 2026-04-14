# Vaani — India's Voice-First Financial Advisor

> Financial inclusion for India's next 800 million — in your language, by your voice.

**Vaani** is a voice-first financial advisor that works in 22 Indian languages. No forms, no typing, no English required. Just speak and discover government schemes, compare FD rates, check eligibility, and get a personalized financial health score.

## Mission

To bridge India's financial inclusion gap — reaching the 800 million+ Indians who are underserved by traditional fintech. We do this through voice-first UX that works in every Indian language, removing the barrier of literacy and English fluency.

**Core beliefs:**
- Financial advice should be free, not a bank product
- Language should never be a barrier to financial literacy
- The next billion users will access services by voice, not text

## Features

### Voice-First Chat
- **22 Indian languages** with auto-detection from voice input
- **Browser Web Speech API** for free unlimited TTS (no API key needed)
- **ElevenLabs** premium voice option (saves API credits)
- **Groq Whisper** for cloud STT — fast, accurate
- **Local Whisper** (Xenova/transformers) — works offline, zero cost
- Push-to-talk with 5-second countdown
- Full-screen voice mode for accessibility

### Government Schemes (22 schemes)
- PM Kisan, Sukanya Samriddhi, Jan Dhan, PMJJBY, PMSBY, Atal Pension, PM Awas Yojana, MUDRA, Stand Up India, Kaushal Vikas, PM Vidyarthi, NPS, and more
- Bilingual descriptions (Hindi + English), eligibility criteria, required documents, application modes, official websites, keyword tags for natural language search

### FD Rate Comparator
- Compare rates from **SBI, HDFC, ICICI, PNB, Bank of Baroda, Axis, Kotak, India Post**
- Senior citizen rates, tenure-specific rates (1yr, 2yr, 3yr, 5yr)
- Post Office schemes: PPF, NSC, KVP, RD, Sukanya Samriddhi, SCSS, Mahila Samman

### Eligibility Checker
- Conversational 2-3 question flows for insurance, pension, loan, and savings schemes
- Auto-detects user profile from conversation (age, gender, occupation, income)
- State-aware scheme matching

### VAANI Score
- Financial health score (0-100) computed from conversation history
- 5 pillars: Emergency Fund, Insurance Coverage, Active Investments, Savings Rate, Debt Health
- Level classification with Hindi advice

### Life-Event Investment Ladder
- Detects: marriage, education, harvest, emergency, retirement
- Generates contextual investment allocation with instruments and timelines

### Micro-Nudge Savings
- Detects idle balance, calculates savings potential
- Suggests micro-SIP starting points (₹20-100)

### Bank & CSC Locator
- Find nearest banks and Common Service Centres by pincode
- Returns phone numbers, websites, application instructions

### Lead Capture
- Phone validation, name sanitization, product interest detection
- B2B financial product partnership pipeline

### OCR Document Scanner
- Passbook/bank statement scanning via MiniMax OCR Pro (server-side proxy)

### Accessibility
- Large text mode (explicit font sizes, no layout break)
- High contrast mode (black bg, white text, green accents)
- Vibration feedback on mobile
- Keyboard navigation, ARIA labels

### PWA & Offline
- Installable on mobile/desktop
- Service worker caches all assets
- Offline-capable after first load

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

## Deployment

### Frontend → Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com) — sign in with GitHub
2. Click **"Add New Project"** → Import `kuro-toji/vaani`
3. **Framework:** Vite
4. **Root Directory:** `.` (default)
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`
7. **Environment Variables** (add in Vercel dashboard):
   - `VITE_API_URL` = `https://your-render-backend.onrender.com` (your Render URL)
   - `VITE_MINIMAX_API_KEY` = your MiniMax key
   - `VITE_GROQ_API_KEY` = your Groq key
   - `VITE_ELEVENLABS_API_KEY` = your ElevenLabs key (optional)
8. Click **Deploy**

Vercel auto-deploys on every push to `master`.

### Backend → Render

1. Go to [render.com](https://render.com) — sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo or upload `server/` as a private repo
4. **Root Directory:** `server`
5. **Build Command:** `npm install`
6. **Start Command:** `node index.js`
7. **Environment:** Node
8. **Plan:** Free tier is sufficient
9. **Environment Variables** (add in Render dashboard):
   - `MINIMAX_API_KEY` = your MiniMax key
   - `GROQ_API_KEY` = your Groq key
   - `ELEVENLABS_API_KEY` = your ElevenLabs key
   - `CORS_ORIGINS` = `https://your-vercel-frontend.vercel.app` (your Vercel URL)
   - `PORT` = `3001`
10. Click **Create Web Service**

Wait for deployment to complete — you'll get a URL like `vaani-backend.onrender.com`.

### Update Vercel with Backend URL

After Render deploys:
1. In Vercel dashboard → your project → **Settings** → **Environment Variables**
2. Add/Update `VITE_API_URL` = `https://vaani-backend.onrender.com`
3. Redeploy (or push a commit to trigger auto-deploy)

### One-Time Setup Summary

| Step | Platform | What | URL |
|------|----------|------|-----|
| 1 | Vercel | Deploy frontend from GitHub | vercel.com |
| 2 | Render | Deploy backend from GitHub | render.com |
| 3 | Vercel | Set `VITE_API_URL` to Render URL | vercel.com |
| 4 | Done | Submit your live URL | |

## Quick Start (Local)

```bash
# Install frontend
npm install

# Install backend
cd server && npm install

# Run both (two terminals)
npm run dev          # Frontend: http://localhost:5173
cd server && node index.js  # Backend: http://localhost:3001
```

## API Keys

- **MiniMax:** [platform.minimaxi.chat](https://platform.minimaxi.chat)
- **Groq:** [console.groq.com/keys](https://console.groq.com/keys)
- **ElevenLabs:** [elevenlabs.io](https://elevenlabs.io) (free tier: 10k chars/month)

## Security

- API keys proxied through backend (never exposed in browser)
- Helmet security headers (CSP, X-Frame, etc.)
- Rate limiting on all API routes
- Phone validation + name sanitization on lead capture
- Lead data requires admin auth header

## License

MIT — Built for Bharat

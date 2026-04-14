# Vaani — India's Voice-First Financial Advisor 🎙️

> Financial inclusion for India's next 800 million — in your language, by your voice.

**Vaani** is a voice-first financial advisor that works in 22 Indian languages. No forms, no typing, no English required. Just speak and discover government schemes, compare FD rates, and check eligibility.

## ✨ Features

### 🏦 Government Schemes (12 schemes)
- PM Kisan (₹6,000/year to farmers)
- Sukanya Samriddhi (7.6% tax-free for daughters)
- Pradhan Mantri Jan Dhan (zero-balance bank account)
- PMJJBY & PMSBY (₹436 and ₹20/year life & accident insurance)
- Atal Pension (₹3,000-5,000/month pension)
- PM Awas Yojana (₹1.2 lakh housing subsidy)
- MUDRA Loans (up to ₹10 lakh for traders)
- And 5 more...

### 📊 FD Rate Comparator
Compare fixed deposit rates from **SBI, HDFC, ICICI, PNB, Bank of Baroda, Axis, Kotak, India Post** — ranked by rate.

### ✅ Eligibility Checker
Conversational 2-3 question flows for: PMJJBY, PMSBY, Atal Pension, MUDRA, Sukanya Samriddhi.

### 🏧 Bank & CSC Locator
Find nearest banks and Common Service Centres by pincode.

### 🎤 Voice-First Design
- Speaks in your language (22 Indian languages)
- Auto-detects language from your voice
- Pre-recorded Hindi/English welcome greetings (no API cost)
- Browser Web Speech API for chat TTS (free, unlimited)

## 🚀 Quick Start

```bash
# Install dependencies
npm install
cd server && npm install

# Start development
npm run dev:full

# Build for production
npm run build
```

**Frontend:** http://localhost:5173
**Backend:** http://localhost:3001

## 🔑 Environment Variables

Copy `.env.example` files and add your API keys:

### Frontend (.env)
```
VITE_MINIMAX_API_KEY=your_key
VITE_GROQ_API_KEY=your_key
VITE_ELEVENLABS_API_KEY=your_key  # optional - browser TTS works without it
```

### Backend (server/.env)
```
MINIMAX_API_KEY=your_key
GROQ_API_KEY=your_key
ELEVENLABS_API_KEY=your_key
PORT=3001
```

### Getting API Keys
- **MiniMax:** https://platform.minimaxi.chat
- **Groq:** https://console.groq.com/keys
- **ElevenLabs:** https://elevenlabs.io (free tier: 10k chars/month)

## 🗂️ Project Structure

```
src/
├── components/     # React UI components
├── context/        # React context providers
├── data/          # Static data (schemes, FD rates, languages)
├── hooks/         # Custom React hooks (useChat, useVoice, etc.)
├── pages/         # Page components (LandingPage)
└── services/     # Business logic services

server/
├── routes/        # Express API routes
│   ├── minimax.js  # MiniMax AI proxy
│   ├── leads.js     # Lead capture
│   ├── stt.js      # Speech-to-text proxy
│   └── tts.js      # Text-to-speech proxy
└── index.js       # Express server entry
```

## 🎯 Demo Flow

1. **Open app** → Welcome greeting plays in Hindi/English
2. **Enter pincode** → Language auto-detected, region identified
3. **Ask in your language** → "Mujhe government scheme batao"
4. **Get matching schemes** → Real data, ranked by your profile
5. **Check eligibility** → 2-3 question conversational flow
6. **Find nearby CSC** → Bank/CSC addresses + phone numbers
7. **Express interest** → Lead captured for B2B partners

## 🌐 Tech Stack

- **Frontend:** React 18, Vite, CSS-in-JS
- **Backend:** Express.js, Node.js
- **AI:** MiniMax M2.7 (chat), Groq Whisper (STT), Browser Web Speech (TTS)
- **APIs:** Groq, MiniMax, ElevenLabs (pre-recorded audio)
- **Deployment:** Vercel (frontend), Render (backend)

## 📱 PWA Install

Vaani is a Progressive Web App — install it on your phone or desktop:

1. Open in Chrome/Safari
2. Tap "Add to Home Screen"
3. Works offline (cached assets)

## 🔒 Security

- API keys proxied through server (never exposed in browser)
- Lead data requires admin auth header
- Phone validation + name sanitization on all inputs
- CSP headers via Helmet

## 📄 License

MIT — Built for Bharat 🇮🇳

---

*Vaani — आपकी आवाज़, आपकी भाषा, आपकी वित्तीय सहायक।*

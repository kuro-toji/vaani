# VAANI: Vernacular Adaptive AI Navigator for Investments

> A dialect-native, hyper-accessible AI financial co-pilot empowering rural India's next 800 million.

![Hackathon](https://img.shields.io/badge/Hackathon-Blostem_AI_Builder-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Prototype-orange)

---

## One-Line Pitch

**"Financial literacy shouldn't require English fluency."**

VAANI is an AI-powered personal finance advisor that lets rural and semi-urban Indians ask financial questions in their own language — using voice or text — with zero typing required. It works on any phone's browser and is accessible to users with visual, motor, or cognitive impairments.

---

## The Problem

**Current fintech serves only the top 10%.**

800 million Indians are excluded from quality financial guidance:

- **Farmers, daily wage earners, elderly, specially-abled** — systematically underserved
- **Tiny text, complex charts, formal jargon** — creates fear and confusion
- **Predatory lending thrives in low-literacy zones** — 12,000 INR avg. yearly loss per household
- **Feature phones and low-end Android** — 85% of rural India can't use existing apps
- **15% have disabilities** — requiring accessible interfaces that don't exist

> *"The last mile in financial inclusion isn't about infrastructure — it's about trust, language, and accessibility."*

---

## The Solution: The "Curb-Cut Effect"

**Designing for the margins creates a superior product for all.**

VAANI applies **sensory + cognitive engineering**, not traditional UI:

- When you build for the motor-impaired → everyone benefits from hands-free voice
- When you build for the visually impaired → large text mode helps everyone in sunlight
- When you build for the cognitively impaired → simplified flows reduce cognitive load for all
- When you build for the speech-impaired → icon grids work across language barriers

**The curb-cut effect**: Ramps built for wheelchairs benefit delivery carts, cyclists, and parents with strollers. VAANI's accessibility-first approach creates a product that works *better* for everyone.

---

## Core Features

| # | Feature | Description |
|---|---------|-------------|
| | **Full-Screen Voice Target (PTT)** | Press-to-talk with 56px touch targets + hands-free wake word for motor-impaired users |
| | **Eyes-Free Haptic Loop** | `navigator.vibrate` feedback loop for visually impaired — every action confirmed by vibration |
| | **Zero-Voice Macro-Chips** | Icon grid (tractor, hospital, mandap) for speech-impaired — tap to speak without voice |
| | **Cognitive Simplicity Mode** | Traffic-light UI (Green/Yellow/Red) — Green/Yellow/Red decisions for users with cognitive impairments |
| | **Dialect-Native Concept Mapping** | "Galla Band" for FD in Bhojpuri/Maithili, "Hafta Waala" for SIP in Punjabi |
| | **Acoustic Warmth** | ElevenLabs TTS (`eleven_multilingual_v2`) — natural voice output in all 28 languages |
| | **Micro-Trust Transactions** | 10 INR risk-free test deposits — let users verify before committing |
| | **28 Indian Languages** | Auto-detected from pincode or manual selection |
| | **Pincode-Based Region Detection** | Enter pincode → auto-detect language + regional context (bank rates vary by RBI region) |
| | **Prompt Compactor** | 60–70% token reduction — only topic-relevant data sent per query |
| | **PWA + Offline Support** | Service Worker caches app shell; works partially offline |
| | **Security Hardened** | LocalStorage encryption, XSS sanitization, CSP headers, rate limiting |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React 18 + Vite + Tailwind)    │
├─────────────────────────────────────────────────────────────┤
│  Voice Input                                                │
│  ├── Groq Whisper-large-v3 (primary STT)                    │
│  └── Web Speech API (offline-capable fallback)             │
│                                                              │
│  Language Detection                                          │
│  ├── franc-min (browser-side, 22+ Indian languages)        │
│  └── MiniMax M2.7 fallback                                  │
│                                                              │
│  Chat AI: MiniMax M2.7 via backend proxy                   │
│                                                              │
│  TTS Output: ElevenLabs (eleven_multilingual_v2)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express.js :3001)                 │
├─────────────────────────────────────────────────────────────┤
│  POST /api/chat         → MiniMax M2.7 proxy               │
│  POST /api/tts/speak    → ElevenLabs TTS                   │
│  POST /api/detect/lang  → Language detection               │
│  POST /api/stt/transcribe → Groq Whisper STT               │
│  Rate limiting + response caching                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Demo Flow

```
User opens VAANI → Mic icon prominent on screen

TAPS MICROPHONE or says wake word
   ↓
SPEAKS IN NATIVE LANGUAGE
   "Mujhe fixed deposit ke baare mein jaanna hai"
   ↓
VAANI DETECTS LANGUAGE + REGION via pincode
   (Hindi, Bihar region)
   ↓
ROUTES TO RELEVANT FINANCIAL TOPIC
   Fixed Deposit → Bihar RBI region rates
   ↓
PROVIDES CULTURALLY-RELEVANT ANSWER
   "Bihar mein FD karne ke liye SBI mein jaao,
    6.5% yah 7.2% tak milta hai—
    Galla Band ki tarah safe hai!"
   ↓
SPEAKS ANSWER BACK + shows in text
   ElevenLabs TTS in Hindi
   ↓
OPTION TO CONTINUE or switch language
   Water-drop ripple animation → new language active
```

---

## Quick Start

```bash
# Frontend + Backend
npm install
cd server && npm install && cd ..

# Create .env files (see Environment Variables section)

# Run both together
npm run dev:full
# → Frontend: http://localhost:5173
# → Backend:  http://localhost:3001
```

---

## Environment Variables

### Frontend (`.env` in root)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_MINIMAX_API_KEY` | Yes | MiniMax API key |
| `VITE_GROQ_API_KEY` | No | Groq API key (cloud Whisper STT) |
| `VITE_ELEVENLABS_API_KEY` | No | ElevenLabs API key (TTS) |

### Backend (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MINIMAX_API_KEY` | Yes | — | MiniMax API key |
| `GROQ_API_KEY` | No | — | Groq API key |
| `ELEVENLABS_API_KEY` | No | — | ElevenLabs API key |
| `PORT` | No | `3001` | Server port |

---

## Roadmap

### Phase 1: Universal Accessibility Upgrades
1. **Voice-Biometric Auth** — voice-print unlock instead of passwords/PINs
2. **Cognitive Load Reduction Mode** — strip numbers/charts, traffic-light system, single PTT button
3. **Visual Transcript & Tap-to-Speak** — icon-card grid as macro-prompts for speech-impaired

### Phase 2: Mass Adoption Infrastructure
4. **WhatsApp/USSD Fallback** — headless operation for 2G/WhatsApp environments
5. **Family Node Linking** — multiple phones linked to household financial goal
6. **Micro-Nudge Savings** — AI identifies 20 INR idle balances, voice nudge to save

### Phase 3: Infrastructure & Security
7. **Edge-Deployed WAF** — localized firewall at API gateway, brute-force protection
8. **Immutable AI Audit Logging** — hashed ledger for every financial recommendation, compliance trail

---

## Supported Languages

**28 Indian Languages** — auto-detected from pincode or manual selection:

```
Hindi · Bengali · Telugu · Marathi · Tamil · Gujarati · Kannada
Malayalam · Punjabi · Odia · Assamese · Urdu · Maithili · Santali
Kashmiri · Nepali · Sindhi · Konkani · Dogri · Bodo · Manipuri
Sanskrit · Bhojpuri · Rajasthani · Chhattisgarhi · Tulu · Haryanvi · Magahi
(+ English)
```

---

## Security Features

- **LocalStorage encryption** — user data never stored in plain text
- **XSS sanitization** — all user inputs sanitized before rendering
- **SQL injection protection** — parameterized queries on backend
- **CSP headers** — strict Content-Security-Policy
- **Rate limiting** — API endpoints protected against abuse
- **Input validation** — strict schema validation on all endpoints

---

## Project Structure

```
vani/
├── src/
│   ├── components/       # ChatWindow, ChatInput, MessageBubble, ConfirmationModal
│   ├── context/          # Accessibility, CognitiveMode contexts
│   ├── data/             # languages.js, ratesData.js
│   ├── hooks/            # useChat.js, useVoice.js
│   ├── pages/            # LandingPage, Home
│   ├── services/         # geminiService, elevenLabsService, groqService
│   └── App.jsx           # Root component
├── server/
│   ├── index.js          # Express entry point
│   ├── routes/           # API routes
│   └── .env.example      # Env template
├── public/
│   └── sw.js             # Service Worker (PWA)
├── .env                  # Frontend env vars
├── vite.config.js        # Vite config with /api proxy
└── package.json
```

---

## Stats

| Metric | Value |
|--------|-------|
| Languages | 28 |
| Commits | 146 |
| Voice-First | Yes |
| WCAG Compliant | Yes |
| PWA Ready | Yes |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 (PWA) + Vite + Tailwind CSS |
| Backend | Express.js |
| STT | Groq API + Whisper-large-v3 |
| LLM | MiniMax API (M2.7) |
| TTS | ElevenLabs (`eleven_multilingual_v2`) |

---

<div align="center">

**Star this repo if VAANI helped you!**

*Financial literacy for 800M+ Indians — one voice at a time.*

</div>

# Vaani — India's Voice-First Financial Advisor

> Financial inclusion for India's next 800 million — in your language, by your voice.

**Live Demo:** [https://vaani-gold-theta.vercel.app](https://vaani-gold-theta.vercel.app)

> **Note:** Backend deployed on Render free tier — may take ~30s on first request (cold start). If it returns an error, refresh once.

**Vaani** is a voice-first financial advisor that works in 22 Indian languages. No forms, no typing, no English required. Just speak and discover government schemes, compare FD rates, manage your investments, track taxes, and get a personalized financial health score.

---

## Mission

To bridge India's financial inclusion gap — reaching the 800 million+ Indians who are underserved by traditional fintech. We do this through voice-first UX that works in every Indian language, removing the barrier of literacy and English fluency.

**Core beliefs:**
- Financial advice should be free, not a bank product
- Language should never be a barrier to financial literacy
- The next billion users will access services by voice, not text
- Simple Hindi/regional language — "aapki kul daulat kitni hai" not "net worth"

---

## Features

### 💰 Idle Money Management
- Detects idle balance across all connected accounts
- Voice alert: "₹12,000 idle hai, liquid fund mein lagaein?"
- One-voice-command deployment to liquid fund / T-bill
- Calculates extra earnings potential from better investment

### 📊 Tax Intelligence
- **Tax Harvesting**: "3 din ruko — LTCG ho jayega, ₹4,200 bachenge"
- **80C Tracker**: Shows used/remaining from ₹1,50,000 limit
- **Advance Tax Calculator**: 4 deadlines with balance due alerts
- **TDS Auto-Detection**: Alerts when ₹30,000+ payment received
- **Form 26AS Reconciliation**: Matches expected vs actual TDS

### 🧾 Freelancer OS
- Income logging by voice: "Rahul ne ₹25,000 bheja project ke liye"
- Client-wise payment tagging with pending reminders
- GST invoice generation by voice command
- ITR data export for CA filing
- TDS threshold detection with PAN reminder

### 🏦 Financial Command Center
- Live net worth across all institutions (bank, FD, SIP, gold, crypto)
- Voice: "Meri total daulat kitni hai?" → speaks in Hindi
- Full debt picture (EMIs, credit cards, loans)
- FIRE progress tracker with monthly savings needed
- EMI burden alert if >40% of income

### 🛒 Spend Awareness
- Purchase intent check: "Kya aap sure hain?"
- Opportunity cost shown: "₹3,000 = 10 saal mein ₹18,000"
- Monthly spend summary by category (food, transport, shopping)
- Wishlist with savings reminders
- Budget vs actual tracking

### 💳 Credit Intelligence
- Portfolio-backed loan explanation (LAMF)
- "₹1,40,000 tak loan — 10.5% pe, credit card se 75% sasta"
- Borrowing capacity calculator (EMI-based)
- Interest rate comparison: CC 36% vs Personal 18% vs LAMF 10.5%
- Savings calculator showing yearly interest difference

### 🎯 Core Features
- **22 Indian languages** with auto-detection from voice
- **FD/SIP Recommendations**: Multi-factor weighted scoring (goal fit 35%, liquidity 25%, return 20%, risk 10%, tenure 10%)
- **Government Schemes**: 22 schemes with eligibility checker
- **VAANI Score**: Financial health score 0-100 based on 5 pillars
- **Life-Event Investment Ladder**: Marriage, education, retirement planning

### 🔊 Voice Capabilities
- Browser Web Speech API (free, unlimited TTS)
- ElevenLabs premium voice option
- Groq Whisper for cloud STT
- Local Whisper (offline, zero cost)
- Push-to-talk with visual countdown

---

## Architecture

### APK (React Native) — android-app/Vaani/

```
android-app/Vaani/src/
├── screens/
│   ├── CommandCenterScreen.tsx     # Net worth, FIRE, debt
│   ├── FreelancerScreen.tsx        # Income, invoices, ITR
│   ├── TaxIntelligenceScreen.tsx   # Harvesting, 80C, advance
│   ├── SpendAwarenessScreen.tsx    # Budget, wishlist
│   └── CreditIntelligenceScreen.tsx # LAMF, capacity
├── services/
│   ├── idleMoneyService.ts         # Idle balance detection
│   ├── taxIntelligenceService.ts    # Tax harvesting, TDS
│   ├── freelancerService.ts         # Income tracking, GST
│   ├── commandCenterService.ts      # Net worth, FIRE
│   ├── spendAwarenessService.ts     # Budget tracking
│   ├── creditIntelligenceService.ts # LAMF, borrowing
│   ├── recommendationEngine.ts      # FD/SIP scoring
│   ├── amfiService.ts              # AMFI India API (10,000+ funds)
│   └── fdScraperService.ts         # Bank rate scraping
└── navigation/
    └── AppNavigator.tsx            # Tab + Stack navigation
```

### Web (React/Vite) — src/

```
src/
├── components/
│   ├── dashboard/
│   │   ├── CommandCenter.jsx        # Net worth, FIRE, debt
│   │   ├── FreelancerOS.jsx        # Income, clients, ITR
│   │   ├── TaxIntelligence.jsx      # Harvesting, 80C, advance
│   │   ├── SpendAwareness.jsx       # Budget, wishlist
│   │   ├── CreditIntelligence.jsx   # LAMF, capacity
│   │   ├── Dashboard.jsx           # Main portfolio view
│   │   ├── PortfolioChart.jsx      # Asset allocation
│   │   ├── SIPTracker.jsx          # SIP monitoring
│   │   ├── FDLadderTimeline.jsx    # FD maturity ladder
│   │   └── CryptoWallet.jsx        # BTC/ETH live prices
│   └── chat/
│       ├── ChatWindow.jsx           # Message history
│       ├── ChatInput.jsx            # Voice input
│       ├── MessageBubble.jsx        # Chat messages
│       └── InlineActionCard.jsx     # Action buttons
├── context/
│   ├── AuthContext.jsx             # Supabase auth
│   ├── ChatContext.jsx             # Chat state
│   └── LanguageContext.jsx         # 22 language support
├── services/
│   ├── minimaxService.js           # MiniMax M2.7 chat
│   ├── recommendationService.js    # FD/SIP scoring
│   └── ocrService.js               # Document scanning
├── data/
│   ├── schemes.js                  # 22 government schemes
│   ├── fdRates.js                  # Bank FD rates
│   └── languages.js               # 22 Indian languages
└── pages/
    ├── AppPage.jsx                 # Main app layout
    ├── LandingPage.jsx             # Marketing page
    └── AuthPage.jsx                # Auth flow
```

### Backend (Express.js) — server/

```
server/
├── routes/
│   ├── minimax.js     # MiniMax proxy
│   ├── chat.js        # Streaming chat endpoint
│   ├── stt.js         # Groq Whisper proxy
│   ├── tts.js         # ElevenLabs proxy
│   └── ocr.js         # Document scanning
├── index.js
└── socket.js          # Real-time updates
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **APK Frontend** | React Native, TypeScript, React Navigation |
| **Web Frontend** | React 18, Vite, Tailwind CSS |
| **AI/ML** | MiniMax M2.7 (chat), Groq Whisper (STT), ElevenLabs (TTS) |
| **Voice** | Browser Web Speech API, Franc (language detection) |
| **Backend** | Express.js, Socket.IO, Helmet, rate-limiting |
| **Database** | Supabase (PostgreSQL) |
| **Deployment** | Vercel (web), APK builds |

---

## Getting Started

### Web (Local)

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Frontend: http://localhost:5173

# Run backend
cd server && npm install
node index.js
# Backend: http://localhost:3001
```

### APK (Android)

```bash
cd android-app/Vaani
npm install
npx expo start
# Scan QR code with Expo Go app
```

---

## API Keys Required

- **MiniMax:** [platform.minimaxi.chat](https://platform.minimaxi.chat)
- **Groq:** [console.groq.com/keys](https://console.groq.com/keys)
- **ElevenLabs:** [elevenlabs.io](https://elevenlabs.io) (free tier: 10k chars/month)
- **Supabase:** [supabase.com](https://supabase.com) (create project)

---

## Voice Commands Examples

| Voice Command | Response |
|---------------|----------|
| " mera account mein 15,000 hain " | Logs balance, checks for idle money |
| " ₹3,000 ka jacket kharidna hai " | "₹3,000 = 10 saal mein ₹18,000. Phir bhi?" |
| " Rahul ne ₹50,000 bheja " | Logs income, tags to client |
| " meri total daulat kitni hai " | Speaks net worth in Hindi |
| " FD suggest karo " | Shows ranked FD recommendations |
| " tax check karo " | Shows tax harvesting opportunities |
| " invoice banao " | Generates GST invoice |

---

## Security

- API keys proxied through backend (never exposed in browser)
- Helmet security headers (CSP, X-Frame, etc.)
- Rate limiting on all API routes
- Supabase Row Level Security (RLS) enabled
- Lead data requires admin auth header

---

## Database Schema (Supabase)

```sql
-- Core tables
users, profiles, portfolios, transactions

-- Feature tables
idle_money_detections, tax_harvest_opportunities, freelancer_clients
freelancer_invoices, investment_holdings, debt_tracker, fire_progress
```

---

## License

MIT — Built for Bharat 🇮🇳
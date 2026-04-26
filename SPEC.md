# VAANI — Technical Specification
## Voice-First Financial Advisor for India

> **Version:** 1.0.0  
> **Last Updated:** 2026-04-26  
> **Status:** Pre-production rebuild

---

## 1. Concept & Vision

VAANI is a voice-first financial advisor that works in 22 Indian languages. No forms, no typing, no English required. Speak and discover government schemes, compare FD rates, track your portfolio, and get a personalized financial health score — all through your voice.

The experience should feel like chatting with a knowledgeable village elder who also happens to know every financial product in India. Premium, fast, and deeply Indian.

**Core beliefs:**
- Financial advice should be free, not a bank product
- Language should never be a barrier to financial literacy
- The next billion users will access services by voice, not text

---

## 2. Design Language

### Color Palette
```
Background (OLED)     #080808   — Primary background, OLED black
Surface              #111111   — Cards, panels, elevated elements
Surface Elevated     #1A1A1A   — Modals, popovers, toasts
Border Subtle        rgba(255,255,255,0.06)  — Hairline borders
Border Active        rgba(255,255,255,0.12)  — Focused/hover borders

Primary (VAANI)      #1D9E75   — Brand green, CTAs, active states
Primary Hover        #1EB385   — Primary at 90% brightness
Primary Muted        rgba(29,158,117,0.15) — Primary with 15% opacity for backgrounds

Accent (Voice)       #6366F1   — Voice input, listening states, AI
Accent Glow          rgba(99,102,241,0.2) — Glow effects for voice

Text Primary         #FFFFFF   — Headlines, primary content
Text Secondary       #A1A1AA   — Body text, descriptions
Text Tertiary        #52525B   — Placeholders, disabled
Text Inverse         #080808   — Text on primary buttons

Success             #10B981   — Positive returns, gains
Warning             #F59E0B   — Maturing soon, alerts
Danger              #EF4444   — Losses, errors, negative returns

Orange Accent        #FF6B00   — Secondary accent for features/stats
```

### Typography
```
UI Font:        Inter (Google Fonts)
  - 400 Regular    — Body text, descriptions
  - 500 Medium     — Buttons, labels, nav items
  - 600 Semibold   — Subheadings, card titles
  - 700 Bold       — Headlines, important values

Hero Font:       Bricolage Grotesque (Google Fonts)
  - 700 Bold       — Hero headlines only
  - 800 ExtraBold  — Massive display text (64px+)

Devanagari Fallback:  Noto Sans Devanagari (lazy-loaded)
Indian Script Fallback: Noto Sans [script] (lazy-loaded per language)
```

### Spacing System
```
Base unit: 4px
xs:   4px   — Tight inline spacing
sm:   8px   — Component internal padding
md:   16px  — Standard gaps, card padding
lg:   24px  — Section spacing
xl:   32px  — Major section gaps
2xl:  48px  — Page section dividers
3xl:  64px  — Hero padding, large gaps
```

### Radius System
```
sm:   8px   — Buttons, chips, small cards
md:   12px  — Input fields, medium cards
lg:   16px  — Chat bubbles, large cards
xl:   20px  — Modals, panels
full: 9999px — Pills, avatars
```

### Shadows & Glass
```
Glass Surface:
  background: rgba(255,255,255,0.04)
  backdrop-filter: blur(20px)
  border: 1px solid rgba(255,255,255,0.06)
  border-radius: 16px

Elevated Glass:
  background: rgba(255,255,255,0.06)
  backdrop-filter: blur(24px)
  border: 1px solid rgba(255,255,255,0.08)
  border-radius: 16px

Card Shadow:
  box-shadow: 0 4px 24px rgba(0,0,0,0.4)

Glow (Voice Active):
  box-shadow: 0 0 0 4px rgba(99,102,241,0.2), 0 0 20px rgba(99,102,241,0.1)
```

### Motion Philosophy
```
Timing:      200ms spring (cubic-bezier(0.34, 1.56, 0.64, 1))
Duration:    Micro: 150ms | Standard: 200ms | Emphasis: 300ms
Direction:   Content slides up (translateY: 8px → 0)
Opacity:     Fade in only (never fade out as primary direction)

Principles:
  - Every interactive element has a micro-animation response
  - No animation should block user input
  - Respect prefers-reduced-motion
  - Voice listening state has ambient pulse animation
```

### Icon System
```
Library:     Lucide React (consistent stroke, 24px default)
Stroke:      1.5px (lighter) for dense UI, 2px for standalone icons
Sizes:       sm: 16px | md: 20px | lg: 24px | xl: 32px
Color:       Inherit from text color (currentColor)
```

---

## 3. Layout Architecture

### Website Layout
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (fixed, 64px)                                       │
│  Logo | Language Selector | Nav | Auth Button               │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                       │
│  CHAT PANEL (40%)    │  DASHBOARD PANEL (60%)               │
│  Full-height         │  Scrollable                          │
│  - Messages          │  - Stat Cards Row                    │
│  - Voice Input       │  - Portfolio Chart                   │
│  - Quick Actions     │  - FD/SIP Ladders                    │
│                      │  - Recent Transactions                │
│                      │                                       │
└──────────────────────┴──────────────────────────────────────┘
```

**Breakpoints:**
- `>1024px` — Side-by-side split view (chat 40%, dashboard 60%)
- `768px-1024px` — Chat takes 50%, dashboard takes 50%
- `<768px` — Full-screen tabs: [Chat] [Dashboard] bottom tab bar

### Visual Pacing
```
Section 1: HERO (100dvh)
  - Full viewport height, centered content
  - Massive headline (Bricolage Grotesque 64px+)
  - Animated phone mockup (right side, desktop only)
  - Floating language selector

Section 2: FEATURES (auto)
  - 3-column grid on desktop, single column on mobile
  - Each card: icon + title + description + quote

Section 3: PINCODE DEMO (auto)
  - Centered interactive demo
  - Type pincode → VAANI responds in regional dialect

Section 4: STATS ROW
  - Full-width orange band
  - 4 large stats

Section 5: FOOTER
  - Minimal, dark
```

---

## 4. Website Components

### Header
- Fixed position, 64px height
- Background: `rgba(8,8,8,0.85)` with `backdrop-filter: blur(20px)`
- Logo: Soundwave V mark + "VAANI" wordmark
- Language selector: dropdown with 22 Indian languages
- Nav: Dashboard (if authenticated), Sign In button
- Mobile: hamburger menu

### Landing Page Sections
1. **Hero** — Headline in Bricolage Grotesque, language-aware, animated phone mockup, dual CTAs
2. **Pincode Demo** — Interactive pincode → dialect response demo
3. **Features Grid** — 6 feature cards with Revolut-style hover
4. **Stats Band** — Orange background, 4 key metrics
5. **Footer** — Minimal links, "Made for Bharat" tagline

### Chat Panel Components
1. **ChatWindow** — Full-height scrollable message area
2. **MessageBubble** — User (right, primary green) | Assistant (left, glass surface)
3. **VoiceInput** — Push-to-talk button with waveform animation
4. **StreamingText** — Word-by-word appearance for AI responses
5. **ActionCards** — Inline rich components:
   - FD Rate Card (bank table)
   - Scheme Card (eligibility summary)
   - Portfolio Snapshot Card
   - SIP Calculator Card
   - Budget Alert Card

### Dashboard Panel Components
1. **StatCards** — 4 cards: Total Portfolio | Monthly Savings | VAANI Score | FD Maturity
2. **PortfolioChart** — Donut chart (FD/SIP/Crypto/Cash allocation)
3. **FDLadderTimeline** — Horizontal timeline of FD maturities
4. **SIPTracker** — SIP holdings with current value projection
5. **CryptoWallet** — Balance cards for BTC/ETH/Polygon/BSC
6. **RecentTransactions** — List of voice-logged expenses
7. **QuickActions** — Add Expense | Add FD | Add SIP | Crypto Refresh

### Shared Components
1. **LanguageSelector** — 22 Indian languages, native names
2. **GlassCard** — Reusable glass morphism surface
3. **LoadingSpinner** — Brand green, 3 sizes
4. **Skeleton** — Loading placeholders matching component shapes
5. **Toast** — Bottom-right notifications
6. **ConfirmationModal** — For destructive actions

---

## 5. Backend Architecture

### API Layer (Express.js)
```
Location: /server
Port: 3001 (local), environment variable in production

Routes:
├── /api/chat          POST   — Streaming chat (Socket.io primary, HTTP fallback)
├── /api/minimax       POST   — MiniMax proxy for chat
├── /api/stt           POST   — Groq Whisper STT proxy
├── /api/tts           POST   — ElevenLabs TTS proxy
├── /api/detect        POST   — Language detection (Franc)
├── /api/ocr           POST   — Document scanning (MiniMax OCR)
├── /api/leads         POST   — Lead capture
├── /api/user/portfolio GET   — User portfolio data
├── /api/user/transactions POST — Log transaction
├── /api/crypto/balance POST  — Moralis API proxy
├── /api/fd/calculate  POST   — FD maturity calculator
├── /api/sip/project   POST   — SIP projection calculator
└── /health            GET    — Health check

Security:
- Helmet.js (CSP, HSTS, X-Frame-Options)
- express-rate-limit (100 req/15min general, 10 req/min AI)
- CORS restricted to allowed origins
- Input validation on all endpoints
- API keys proxied server-side only
```

### WebSocket (Socket.io)
```
Events (Client → Server):
├── chat:message       { text, language, userId }  — Send message
├── chat:start        { userId }                   — Start streaming session
├── chat:stop         {}                           — End streaming
├── voice:transcript  { audioBlob, language }     — Voice input
└── portfolio:sync    { userId }                   — Request realtime sync

Events (Server → Client):
├── chat:token        { token }                    — Streaming token (word by word)
├── chat:done         { fullResponse, actionCards }
├── chat:error        { message }
├── chat:tts          { audioUrl }                 — ElevenLabs audio
├── portfolio:update { data }                     — Realtime portfolio change
└── notification     { type, message }            — Push notification
```

### Database (Supabase PostgreSQL)
```
Tables:

users
  id              UUID PRIMARY KEY
  phone           VARCHAR(15) UNIQUE — India phone format
  name            VARCHAR(100)
  preferred_lang  VARCHAR(5) DEFAULT 'hi'
  pincode         VARCHAR(6)
  region          VARCHAR(50)
  vaani_score     INTEGER DEFAULT 0
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

portfolios
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id)
  type            VARCHAR(20) — 'fd' | 'sip' | 'crypto' | 'savings'
  institution     VARCHAR(100)
  principal       DECIMAL(15,2)
  current_value   DECIMAL(15,2)
  interest_rate   DECIMAL(5,2)
  start_date      DATE
  maturity_date   DATE
  frequency       VARCHAR(10) — 'monthly' for SIP
  wallet_address  VARCHAR(100) — for crypto
  blockchain      VARCHAR(20) — 'ethereum' | 'bitcoin' | 'polygon' | 'bsc'
  created_at      TIMESTAMPTZ
  updated_at      TIMESTAMPTZ

transactions
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id)
  type            VARCHAR(10) — 'income' | 'expense' | 'investment'
  amount          DECIMAL(15,2)
  category        VARCHAR(50) — 'groceries' | 'rent' | 'salary' etc.
  description     TEXT
  voice_transcript TEXT — Original voice input
  date            DATE
  created_at      TIMESTAMPTZ

chat_history
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id)
  role            VARCHAR(10) — 'user' | 'assistant'
  content         TEXT
  language        VARCHAR(5)
  action_cards    JSONB — Array of rendered action cards
  created_at      TIMESTAMPTZ

user_settings
  user_id         UUID PRIMARY KEY REFERENCES users(id)
  voice_premium   BOOLEAN DEFAULT false
  continuous_listen BOOLEAN DEFAULT false
  haptic_enabled  BOOLEAN DEFAULT true
  visual_mode     VARCHAR(20) DEFAULT 'normal' — 'normal' | 'large' | 'traffic'
  large_text     BOOLEAN DEFAULT false
  high_contrast   BOOLEAN DEFAULT false
  updated_at      TIMESTAMPTZ

Row Level Security: All tables have user_id based RLS policies.
```

### Redis (Sessions + Rate Limiting)
```
Usage:
- Session storage (express-session with connect-redis)
- Rate limit counters per IP and per user
- WebSocket room mapping (userId → socketId)
- Streaming response cache (5 minute TTL)
- Language detection cache
```

---

## 6. AI Services

### Chat Brain — MiniMax M2.7
```
Provider: MiniMax API (server-side proxy)
Model: mini-max Reasoning (RPM8R1)
Temperature: 0.7
Max Tokens: 2048
Streaming: Yes (SSE)

System Prompt:
"Role: You are VAANI, a trusted voice-first financial advisor for India. You speak in the user's language (detected from input). You NEVER use English unless the user speaks English. You are warm, patient, and use village-level analogies for complex financial concepts. FD = 'galla band' (fixed deposit). SIP = 'har mahine invest'. You provide factual information only, never financial advice. You help users discover government schemes, compare FD rates, track expenses, and understand financial health. Never ask for Aadhaar, PAN, or full bank details. Keep responses under 150 words."
```

### STT — Groq Whisper
```
Provider: Groq Cloud API
Model: whisper-large-v3-turbo
Language: Auto-detect or mapped from user preference
Fallback: @xenova/transformers (local, works offline)

Language Mapping (Groq codes):
hi, bn, te, ta, mr, ur, gu, kn, ml, pa, or, ne, as, en + regional dialects
```

### TTS — Browser Web Speech API + ElevenLabs
```
Free Tier: Browser Web Speech API (unlimited, no API key)
  - Works in Chrome, Edge (good Hindi support)
  - Android: Limited voice options
  - iOS: Good voice options

Premium: ElevenLabs (10k chars/month free tier)
  - Enable via localStorage flag: vaani_premium_voice = '1'
  - voices: Hindi, Bengali, Tamil, Telugu, Marathi + more
  - Used only when enabled to conserve credits

Sentence Splitting:
  - Devanagari: Split on '।', '?', '!', '.'
  - Merge fragments < 10 chars with next sentence
  - Max 400 chars per ElevenLabs call
```

### Portfolio Analysis — Gemini Flash
```
Provider: Google AI (Gemini 2.0 Flash)
Usage: ONLY for structured data tasks
  - Reading CSV/imported bank statements
  - Portfolio allocation analysis
  - Expense categorization
  - NOT for general chat

Cost: $0 (free tier: 1500 req/min, 1M tokens/min)
```

### Language Detection — Franc-min
```
Library: franc-min (WASM, runs in browser)
Supports: 200+ languages including all 22 Indian languages
Fallback: Server-side detection via弗朗
Cache: Detected language stored in session (no re-detection)
```

---

## 7. Voice UX

### Voice Input Flow (Push-to-Talk)
```
1. User taps/holds mic button
2. 400ms delay (skip tap noise)
3. VAD (Voice Activity Detection) waits for volume > threshold
4. Recording starts (webm/opus)
5. User releases or 30s timeout
6. Minimum 1.5s recording check
7. Transcription (Groq Whisper → local Whisper fallback)
8. 2-second countdown for user to edit/cancel
9. Send to chat
```

### Voice Output Flow
```
1. AI response starts streaming (Socket.io token-by-token)
2. First complete sentence detected
3. TTS starts speaking (can begin before full response)
4. If ElevenLabs premium: chunk batched calls
5. If Web Speech: sentence-by-sentence chain
6. Cancel on user input
```

### Wake Word (APK only)
```
Keyword: "Hey Vaani" / "हे वाणी" / "ஹே வாணி"
Implementation: TensorFlow Lite keyword spotting
Battery: Only active when app is in foreground
Fallback: Manual mic tap if wake word fails
```

---

## 8. Money Management Features

### FD Tracking
```
Fields: institution, principal, rate, start_date, maturity_date
Calculations:
  - Simple Interest: A = P(1 + rt)
  - Compound Interest: A = P(1 + r/n)^(nt)
  - TDS on interest > 40k/year: 10% | > 80k: 20% | senior citizen: 30%
  - Days to maturity
  - Projected maturity value
  - XIRR for variable FD amounts

Supported Institutions:
  SBI, HDFC, ICICI, PNB, Bank of Baroda, Axis, Kotak, India Post
  + Post Office: PPF, NSC, KVP, RD, Sukanya Samriddhi, SCSS, Mahila Samman
```

### SIP Tracking
```
Fields: fund_name, institution, principal, frequency (monthly), start_date, nav
Calculations:
  - Units purchased: amount / NAV
  - Current value: units × current NAV
  - XIRR (internal rate of return)
  - Projected value at different rates
  - SIP goal progress

Data Source: Manual entry (Phase 1)
```

### Crypto Wallet Tracking
```
Supported Blockchains: Ethereum, Bitcoin, Polygon, BSC
Balance Fetch: Moralis API (free tier)
  - ETH: eth_getBalance
  - BTC: Bitcoin API via Moralis
  - Polygon: eth_getBalance on Polygon RPC
  - BSC: eth_getBalance on BSC RPC

Display:
  - Current balance (native token)
  - USD value (from Moralis price API)
  - 24h change %
  - No transaction history (read-only)

Manual Entry: Wallet address input
WalletConnect: MetaMask/Trust Wallet connect (Phase 2)
```

### Expense Logging (Voice)
```
Flow: "spent 500 on groceries" / "500 rupees groceries"
Parsed Fields:
  - amount: 500
  - category: groceries
  - date: today (or语音 specified)
  - type: expense

Categories: groceries, rent, utilities, transport, education, healthcare, entertainment, other
```

### Account Aggregator (Phase 2)
```
Provider: Setu AA or Finvu
Framework: RBI-regulated Consent Management
Flow:
  1. User gives bank consent via AA
  2. Setu/Finvu fetches data from bank
  3. VAANI receives: transactions, balances, holdings
  4. Stored in Supabase, shown in dashboard
  5. Real-time sync on each login

Timeline: Phase 2 (post-launch)
```

---

## 9. APK Specifics

### Framework & Libraries
```
Framework:      React Native (CLI, NOT Expo)
  - Reason: Full native module access for voice, haptic, bluetooth
  - Trade-off: Slower initial setup, no OTA updates

Core Libraries:
  expo-av          — Native audio recording/playback
  expo-haptics     — Haptic feedback
  expo-sqlite      — Local SQLite database
  expo-secure-store — Encrypted key storage (settings, tokens)
  react-native-reanimated — 60fps animations (UI thread)
  react-native-gesture-handler — Gestures
  react-native-paper — Material Design components (optional)
  @shopify/flash-list — High-performance lists
  lottie-react-native — Lottie animations
  @walletconnect/react-native-dapp — WalletConnect v2
  react-native-mmkv — Fast key-value storage (profile cache)

Navigation: @react-navigation/native + bottom-tabs + stack
State: Zustand (lightweight, no Redux overhead)
```

### One-Time Setup Flow (Specially Abled)
```
Step 1: Microphone Test
  - Record 3 seconds
  - Play back
  - "Did you hear yourself?" Yes/No

Step 2: Language Selection
  - "Speak your language" — detect from voice
  - Or tap to select from 22 languages
  - Confirm: "Hindi confirmed"

Step 3: Voice Calibration
  - "Speak 'namaste' at your normal volume"
  - Record sample
  - Set volume threshold
  - "Volume calibrated"

Step 4: Haptic Preference
  - Enable/Disable
  - Test: single tap vs double tap vs long press

Step 5: Visual Mode
  - Normal (default)
  - Large Text (140% scale, explicit font sizes)
  - Traffic Light (green/yellow/red only, no text)
  - Can be changed anytime in Settings
```

### Voice Commands (APK)
```
Navigation:
  "dashboard dikhao" / "portfolio kholo" / "wapas jao" / "chat kholo"
  "settings kholo" / "close karo"

Finance:
  "kitna kharcha hua" / "kitna bacha hai"
  "FD rates batao" / "SIP returns dikhao"
  "crypto balance" / "expense add karo 500 rupees"

Accessibility:
  "badi awaaz mein bolo" / "slowly bolo" / "phir se batao"
  "skip karo" / "stop"

Confirmation:
  "haan" / "nahi" / "confirm karo" / "cancel karo"
  "yes" / "no" / "ok" / "done"
```

### Offline Capabilities (APK)
```
FULLY OFFLINE:
  - View portfolio (cached from last sync)
  - View expense history
  - Add expenses (queued in SQLite)
  - FD maturity calculations
  - SIP projections
  - Basic financial health score

REQUIRES NETWORK:
  - AI chat responses
  - Live crypto prices
  - Voice transcription (can fall back to local Whisper)
  - Real-time sync
  - WalletConnect

Offline Queue:
  - Expenses logged offline stored in SQLite
  - Auto-sync on reconnect via Supabase Realtime
  - Visual indicator: "Offline mode" badge
```

---

## 10. Real-Time Sync (Website ↔ APK)

### Architecture
```
Single Source of Truth: Supabase PostgreSQL
Realtime Layer: Supabase Realtime (PostgreSQL changes)

Sync Flow:
  1. User action → Write to Supabase
  2. Supabase publishes change via Realtime
  3. Website Socket.io receives → updates UI
  4. APK receives → updates local SQLite cache

Conflict Resolution:
  - Server timestamp wins
  - Last write wins for same-field edits
  - No offline writes to shared portfolio (expenses only)

Latency Target: < 500ms for all sync operations
```

### Sync Events
```
User adds expense on APK:
  → POST /api/user/transactions
  → Insert into Supabase transactions table
  → Supabase Realtime broadcasts: INSERT on transactions
  → Website Socket.io: portfolio:update event
  → Dashboard refreshes

User adds FD on Website:
  → POST /api/user/portfolio
  → Same flow, reverse direction
```

---

## 11. Government Schemes (22 Schemes)

```
1.  PM Kisan — Farmer income support
2.  Sukanya Samriddhi — Girl child savings
3.  Jan Dhan — Bank account for all
4.  PMJJBY — Life insurance ₹436/year
5.  PMSBY — Accident insurance ₹20/year
6.  Atal Pension Yojana — Pension for unorganized sector
7.  PM Awas Yojana — Housing for poor
8.  MUDRA — Business loans
9.  Stand Up India — Loans for SC/ST women
10. Kaushal Vikas — Skill development
11. PM Vidyarthi — Student education loan
12. NPS — Pension scheme
13. FD (Post Office) — Small savings
14. NSC — National Savings Certificate
15. KVP — Kisan Vikas Patra
16. RD — Recurring Deposit
17. SCSS — Senior Citizen Savings Scheme
18. Mahila Samman — Savings for women
19. PM Vishwakarma — Artisan support
20. Ayushman Bharat — Health insurance
21.Startup India — Business support
22. Stand Up India — Bank loans for women

Each scheme:
  - Name (English + Hindi)
  - Description (bilingual)
  - Eligibility criteria (Hindi + English)
  - Required documents
  - Application mode (online/offline/CSC)
  - Official website URL
  - Keyword tags for voice search
```

---

## 12. Security

```
API Keys:
  - All proxied through Express backend
  - Never exposed in browser or APK

Rate Limiting:
  - 100 req/15min general
  - 10 req/min AI endpoints
  - Per-IP and per-user limits

Input Validation:
  - Phone: Indian format (+91, 10 digits)
  - PIN: 6 digits
  - Amount: Positive decimal, max 15 digits
  - Wallet address: Checksum validation per chain

Finance Data:
  - Row Level Security on Supabase
  - User can only read their own data
  - No Aadhaar/PAN stored (compliance)
  - Crypto: read-only addresses only

Web Security:
  - Helmet.js (CSP, HSTS, X-Frame-Options)
  - CORS restricted to known origins
  - HTTPS enforced in production
```

---

## 13. File Structure

```
/home/kuro/vani/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.jsx       # Main chat container
│   │   │   ├── MessageBubble.jsx    # User + assistant bubbles
│   │   │   ├── VoiceInput.jsx       # Push-to-talk mic button
│   │   │   ├── StreamingText.jsx    # Word-by-word response
│   │   │   ├── LanguageDropdown.jsx # Chat language selector
│   │   │   └── InlineActionCard.jsx # Rich action cards
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx        # Main dashboard container
│   │   │   ├── StatCards.jsx       # 4 stat cards
│   │   │   ├── PortfolioChart.jsx   # Donut allocation chart
│   │   │   ├── FDLadderTimeline.jsx # FD maturity timeline
│   │   │   ├── SIPTracker.jsx       # SIP holdings
│   │   │   ├── CryptoWallet.jsx     # Crypto balance cards
│   │   │   ├── TransactionList.jsx  # Recent voice expenses
│   │   │   └── QuickActions.jsx     # Action buttons
│   │   ├── ui/
│   │   │   ├── GlassCard.jsx        # Reusable glass surface
│   │   │   ├── Button.jsx           # Primary/secondary buttons
│   │   │   ├── Input.jsx            # Text input field
│   │   │   ├── Toast.jsx            # Notifications
│   │   │   ├── Modal.jsx            # Confirmation modal
│   │   │   ├── Skeleton.jsx         # Loading skeleton
│   │   │   └── Spinner.jsx          # Loading spinner
│   │   ├── layout/
│   │   │   ├── Header.jsx           # Fixed header
│   │   │   └── SplitLayout.jsx      # Chat + Dashboard split
│   │   └── common/
│   │       ├── LanguageSelector.jsx # 22 language selector
│   │       └── OnboardingFlow.jsx   # First-time setup
│   ├── pages/
│   │   ├── LandingPage.jsx          # Marketing landing page
│   │   ├── AppPage.jsx              # Main app (chat + dashboard)
│   │   ├── AuthPage.jsx             # Phone OTP auth
│   │   └── SettingsPage.jsx         # User settings
│   ├── context/
│   │   ├── LanguageContext.jsx      # Selected language state
│   │   ├── AuthContext.jsx          # User authentication
│   │   ├── ChatContext.jsx          # Chat state + streaming
│   │   ├── PortfolioContext.jsx     # Portfolio data
│   │   └── RealtimeContext.jsx      # Supabase realtime sync
│   ├── hooks/
│   │   ├── useVoice.js              # Voice input (Web Speech + Whisper)
│   │   ├── useChat.js               # Chat + streaming logic
│   │   ├── usePortfolio.js          # Portfolio CRUD
│   │   ├── useRealtime.js           # Supabase realtime subscriptions
│   │   └── useSocket.js             # Socket.io connection
│   ├── services/
│   │   ├── minimaxService.js        # MiniMax chat proxy
│   │   ├── groqService.js           # Groq Whisper STT
│   │   ├── elevenLabsService.js     # ElevenLabs TTS
│   │   ├── geminiService.js         # Gemini Flash (portfolio)
│   │   ├── supabaseService.js       # Supabase client
│   │   ├── portfolioService.js      # Portfolio calculations
│   │   ├── fdService.js             # FD maturity calculator
│   │   ├── sipService.js            # SIP projection
│   │   ├── cryptoService.js         # Moralis API proxy
│   │   ├── transactionService.js    # Expense logging
│   │   ├── languageDetector.js      # Franc-min wrapper
│   │   └── pincodeService.js        # Pincode → region mapping
│   ├── data/
│   │   ├── languages.js             # 22 Indian languages
│   │   ├── schemes.js               # 22 government schemes
│   │   ├── fdRates.js               # FD rates for all banks
│   │   ├── pincodeMapping.js        # Pincode to language/region
│   │   └── greetings.js             # Per-language welcome messages
│   └── lib/
│       ├── supabase.js              # Supabase client init
│       └── socket.js                # Socket.io client init
│
├── server/
│   ├── index.js                     # Express entry point
│   ├── socket.js                    # Socket.io setup
│   ├── routes/
│   │   ├── chat.js                  # Chat + streaming
│   │   ├── minimax.js               # MiniMax proxy
│   │   ├── stt.js                   # Groq Whisper proxy
│   │   ├── tts.js                   # ElevenLabs proxy
│   │   ├── detect.js                # Language detection
│   │   ├── portfolio.js             # Portfolio CRUD
│   │   ├── transactions.js         # Expense logging
│   │   ├── crypto.js                # Moralis proxy
│   │   ├── fd.js                    # FD calculator
│   │   ├── sip.js                   # SIP projector
│   │   └── leads.js                 # Lead capture
│   └── services/
│       ├── redis.js                 # Redis client
│       └── supabase-server.js       # Server-side Supabase
│
├── assets/
│   ├── fonts/                       # Inter, Bricolage Grotesque
│   ├── icons/                      # Lucide icon components
│   └── animations/                 # Lottie JSON files
│
├── android/                        # React Native Android project
├── ios/                            # React Native iOS project (future)
└── package.json
```

---

## 14. Deployment

```
Website:  Vercel (frontend)
Backend:  VPS (Docker)
Database: Supabase (managed PostgreSQL)
Cache:    Redis (VPS or managed)

CI/CD:
  - Git push → Vercel auto-deploy
  - Git push → VPS SSH deploy (custom script)

VPS Requirements:
  - OS: Ubuntu 22.04
  - RAM: 4GB minimum
  - CPU: 2 vCPU
  - Disk: 40GB SSD
  - Docker + Docker Compose

Environment Variables:
  MINIMAX_API_KEY
  GROQ_API_KEY
  ELEVENLABS_API_KEY
  MORALIS_API_KEY
  GEMINI_API_KEY
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_KEY
  REDIS_URL
  CORS_ORIGINS
  PORT
```

---

## 15. Phases

### Phase 1 (Days 1-3): Website
- [ ] Landing page redesign (Revolut x Linear aesthetic)
- [ ] Chat UI rebuild (WhatsApp bubbles, streaming, action cards)
- [ ] Dashboard rebuild (Stat cards, Portfolio chart, FD/SIP trackers)
- [ ] Supabase Auth (phone OTP)
- [ ] Socket.io real-time chat
- [ ] Voice input + TTS (Web Speech API)
- [ ] Portfolio CRUD (manual entry)
- [ ] FD/SIP calculators
- [ ] 22 Indian languages
- [ ] Pincode → region → language detection

### Phase 2 (Days 4-6): APK
- [ ] React Native project setup
- [ ] Native voice (expo-av, wake word)
- [ ] Voice command system
- [ ] Full voice navigation for specially abled
- [ ] One-time setup flow
- [ ] SQLite offline cache
- [ ] Portfolio sync (Supabase Realtime)
- [ ] Push-to-talk + continuous listening
- [ ] 60fps animations (reanimated)
- [ ] APK build + signing

### Phase 3 (Post-hackathon): Polish
- [ ] Account Aggregator (Setu AA / Finvu)
- [ ] WalletConnect for crypto
- [ ] Gemini Flash portfolio analysis
- [ ] Government scheme eligibility auto-detection
- [ ] VAANI Score refinement
- [ ] Life-event investment ladder
- [ ] Bank statement CSV import
- [ ] Push notifications
- [ ] Dark mode polish
- [ ] Performance audit

---

*Last committed: 2026-04-26 — Initial spec document*
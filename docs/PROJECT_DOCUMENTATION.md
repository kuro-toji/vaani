# VAANI - Voice-First Financial Advisor

## Project Overview

**VAANI** (वाणी) is a bilingual (Hindi/English) voice-first financial advisor for Indian users. It combines voice interaction with financial services like expense tracking, FD/SIP management, tax intelligence, and freelancer income management.

---

## Architecture

```
vani/
├── android-app/Vaani/     # React Native (Expo) mobile app
│   ├── src/
│   │   ├── screens/        # 15+ screens (Chat, Main, Tax, Credit, etc.)
│   │   ├── services/       # 25+ backend services
│   │   ├── types/          # TypeScript interfaces
│   │   ├── constants/      # Colors, config, government schemes
│   │   ├── navigation/     # React Navigation setup
│   │   ├── hooks/          # Custom hooks (useVoice)
│   │   ├── database/       # SQLite operations
│   │   └── lib/            # Supabase, socket clients
│   └── package.json        # Expo SDK 54, React Native 0.81
│
├── src/                    # Web app (React + Vite alternative)
├── server/                 # Backend (duplicate services)
└── public/                 # Static assets, PWA manifest
```

---

## Mobile App (android-app/Vaani)

### Tech Stack
- **Framework**: Expo SDK 54 + React Native 0.81.5
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation 7 (Stack + Bottom Tabs)
- **Database**: SQLite (offline-first via expo-sqlite)
- **Backend**: Supabase (cloud sync)
- **Voice**: expo-av (recording), expo-speech (TTS)
- **Haptics**: expo-haptics for tactile feedback

### Core Screens

| Screen | Purpose |
|--------|---------|
| `SplashScreen.tsx` | Animated logo intro |
| `OnboardingScreen.tsx` | Language selection, permissions |
| `AuthScreen.tsx` | Phone/email auth with biometrics |
| `MainScreen.tsx` | Dashboard with net worth, quick actions |
| `ChatScreen.tsx` | **Main voice interface** - speak to interact |
| `CommandCenterScreen.tsx` | Net worth, loans, FIRE tracker |
| `FreelancerScreen.tsx` | Client income, GST invoices, ITR export |
| `TaxIntelligenceScreen.tsx` | 80C, 80D, tax harvesting, TDS |
| `SpendAwarenessScreen.tsx` | Monthly summary, opportunity cost |
| `CreditIntelligenceScreen.tsx` | Loan comparison, borrowing capacity |
| `SettingsScreen.tsx` | Language, visual mode, haptics |

### Navigation Flow

```
Splash → Onboarding → Auth → MainTabs (Dashboard|Chat|Expenses|Portfolio)
                                    ↓
                        (Stack screens)
                        CommandCenter | Freelancer | TaxIntelligence |
                        SpendAwareness | CreditIntelligence | Settings
```

---

## Key Services

### 1. Chat Service (`chatService.ts`)
- **AI Backend**: MiniMax M2.7 (streaming API)
- **Fallback**: Demo mode with Hindi/English responses
- **System Prompt**: Instructs AI to respond in user's language with financial advice
- **Features**:
  - Extracts expense intents: `[EXPENSE:500:food:chai]`
  - Budget alerts: `[BUDGET_ALERT:food:85]`
  - Removes think tags from AI responses
  - Streams tokens in real-time

```typescript
sendChatMessage(messages, text, language, {
  onToken: (token) => {},      // Stream each token
  onDone: (response) => {},     // Final response
  onError: (error) => {}        // Error handler
});
```

### 2. Money Management (`moneyManagementService.ts`)
- **SQLite Schema**: 8 tables (expenses, budgets, savings_goals, fd_investments, sip_investments, crypto_holdings, gold_holdings, transactions)
- **Offline-First**: All data stored locally, synced to Supabase when online
- **Key Functions**:
  - `addExpense(amount, category, description)`
  - `getExpenses(startDate, endDate, category)`
  - `setBudget(category, monthlyLimit)`
  - `addFDInvestment(bank, amount, rate, tenureMonths)`
  - `addSIPInvestment(fundName, amount)`
  - `getPortfolioSummary()` - totals FD, SIP, Crypto, Gold

### 3. Idle Money Detection (`idleMoneyService.ts`)
- Detects when bank balance exceeds emergency buffer + upcoming EMIs
- Suggests liquid funds (HDFC, ICICI, SBI Liquid Funds)
- Voice: "₹12,000 idle hai, liquid fund mein lagaein?"

**Formula**:
```
idle_amount = total_balance - (upcoming_emis + monthly_budget + emergency_buffer)
```

### 4. Tax Intelligence (`taxIntelligenceService.ts`)
- **Section 80C Tracker**: ₹1,50,000 limit monitoring
- **Tax Harvesting**: Identifies holdings with losses to offset gains
- **Advance Tax**: Calculates quarterly installments
- **TDS Detection**: Alerts when freelancer payments exceed ₹30,000

### 5. Freelancer OS (`freelancerService.ts`)
- **Income Logging**: "Infosys se 50000 aaye"
- **Client Tracker**: Payment history, total income per client
- **GST Invoice Generation**: 18% GST calculation, downloadable
- **ITR Export**: Data formatted for income tax return filing
- **Auto TDS**: Flags payments ≥ ₹30,000 for 10% TDS

### 6. Command Center (`commandCenterService.ts`)
- **Extended Net Worth**: Bank balances + FD + SIP + PPF + Crypto + Gold
- **Debt Summary**: All loans with interest remaining
- **FIRE Calculator**: Years to retirement at current savings rate
- **Loan Management**: Add loans via voice commands

### 7. AMFI Service (`amfiService.ts`)
- **Live NAV Data**: Fetches from official AMFI India API (`api.mfapi.in`)
- **10,000+ Funds**: Direct plan excluded, deduplicated by name
- **Supabase Cache**: Syncs NAV to cloud for faster subsequent queries
- **Popular Funds**: Hardcoded codes for quick access

---

## Voice Interaction Flow

```
User holds mic button
        ↓
startRecording() → Audio.Recording.createAsync()
        ↓
User releases button
        ↓
stopRecording() → getURI() → transcribeAudio()
        ↓
processUserMessage(text)
        ↓
┌───────────────────────────────────────┐
│ 1. Check feature commands (instant)   │
│    - "net worth" → CommandCenter      │
│    - "payment aaya" → Freelancer      │
│    - "tax check" → TaxIntelligence   │
│                                           │
│ 2. Check expense patterns              │
│    - "500 rupee chai kharcha"           │
│                                           │
│ 3. Fallback: AI Chat (MiniMax)         │
│    - Streams response token-by-token   │
│    - speakResponse() for TTS output   │
└───────────────────────────────────────┘
```

### Voice Command Matching (`voiceCommandService.ts`)
- Pattern matching for Hindi/English commands
- Entity extraction: `{ clientName, amount, bankName, months }`
- Examples:
  - `"SBI mein 50000 hai"` → `update_balance` action
  - `"Infosys se 50000 aaye"` → `log_income` action
  - `"retire 50 saal mein 5 crore"` → `fire_progress` action

---

## Database Schema (SQLite)

```sql
expenses (id, amount, category, description, date, synced)
budgets (id, category, monthly_limit, spent, month)
savings_goals (id, name, target_amount, current_amount, deadline)
fd_investments (id, bank, amount, interest_rate, start_date, maturity_date)
sip_investments (id, fund_name, fund_code, amount, nav, units, current_value)
crypto_holdings (id, coin, amount, avg_buy_price, current_price)
gold_holdings (id, amount_grams, avg_buy_price, current_price)
transactions (id, type, amount, category, date)
sync_log (table_name, record_id, action, timestamp)
```

---

## Web App (src/)

### Tech Stack
- **Framework**: React 19
- **Routing**: React Router v6
- **Styling**: Custom CSS with CSS variables
- **Voice**: Web Speech API (SpeechSynthesis)
- **Auth**: AuthContext (placeholder)

### Pages
- `LandingPage.jsx` - Marketing page with language selector
- `AppPage.jsx` - Main dashboard (PWA-style)
- `AuthPage.jsx` - Login/signup
- `DemoPage.jsx` - Demo mode

### Features (partial)
- Multi-language support (11 Indian languages)
- Welcome voice message on load
- Theme with gold/cyberpunk colors
- Private route protection

---

## Duplicate Services Issue

Two `amfiService.js` files exist:

| Location | Type | Purpose |
|----------|------|---------|
| `src/services/amfiService.js` | JavaScript | Web app (older version) |
| `android-app/Vaani/src/services/amfiService.ts` | TypeScript | Mobile app (current) |

**Recommendation**: Keep TypeScript version in mobile app, delete web version or migrate web app to use mobile services.

---

## API Integrations

| Service | API | Auth | Purpose |
|---------|-----|------|---------|
| MiniMax M2.7 | `https://api.minimax.chat/v1/text/chatcompletion_v2` | Bearer token | AI chat with streaming |
| AMFI India | `https://api.mfapi.in/mf` | None (public) | Live NAV data |
| Supabase | `https://dqdievbkvakaptxhzxft.supabase.co` | JWT | Cloud sync, cache |
| Binance | `https://api.binance.com/api/v3` | None (public) | Crypto prices |

---

## Environment Variables Needed

```
# Required
MINIMAX_API_KEY=...
MINIMAX_API_URL=https://api.minimax.chat/v1/text/chatcompletion_v2

# Optional
SUPABASE_URL=https://dqdievbkvakaptxhzxft.supabase.co
SUPABASE_KEY=...
```

---

## Build Status

### Mobile App Issues (needs fixing)

1. **TypeScript errors** - Missing type declarations
2. **JSX flag** - `--jsx` missing in tsconfig
3. **Recording ref** - Not assigned in ChatScreen (only local variable)
4. **Duplicate import** - expo-speech imported twice

### Web App Issues

1. **No real API integration** - Services exist but no production endpoints
2. **Auth incomplete** - AuthContext placeholder
3. **Inconsistent code** - Multiple design versions

---

## Future Roadmap

- [ ] Fix TypeScript errors in mobile app
- [ ] Implement real authentication flow
- [ ] Add push notifications for expense alerts
- [ ] Integrate UPI/bank account linking
- [ ] Build PWA for web access
- [ ] Add investment recommendations engine
- [ ] Multi-user support with family accounts

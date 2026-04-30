# VAANI - Complete Feature List

## 🎯 RECOMMENDATION ENGINE

### Multi-Factor Weighted Scoring Model
| Factor | Weight | Purpose |
|--------|--------|---------|
| Goal Fit | 35% | Matches user's financial goal |
| Liquidity | 25% | Easy withdrawal without penalty |
| Return | 20% | Interest/growth rate |
| Risk | 10% | Stability/volatility |
| Tenure Fit | 10% | Matches investment horizon |

**Formula:** `Score = (0.35×GoalFit) + (0.25×Liquidity) + (0.20×Return) + (0.10×Risk) + (0.10×Tenure)`

### FD Recommendation Engine
- Ranks fixed deposits from 7 banks (SBI, HDFC, ICICI, Yes Bank, Suryoday SFB, Utkarsh SFB, AU Bank)
- Real FD rates with senior citizen support (+0.5%)
- Scored top 3 with explainable rationale
- Voice trigger: "FD suggest karo" / "konsa FD best hai"

### SIP Recommendation Engine
- 10,000+ mutual funds via AMFI India API
- Category scoring: Large Cap, Mid Cap, Index, Debt, Liquid
- Deduplicated (filters Direct plans, shows one Regular plan per scheme)
- Live NAV from api.mfapi.in
- Voice trigger: "SIP recommend karo" / "mutual fund batao"

---

## 💰 IDLE MONEY MANAGEMENT

**Voice Trigger:** "idle hai" / "पैसा पड़ा"

### Features:
- Detects idle balance = totalBalance - emergencyFund - monthlyBudget - upcomingEMI
- Threshold: ₹5,000 minimum idle
- Voice alert: "₹12,000 idle hai, liquid fund mein lagaein? ₹600/month extra milega"
- Auto-suggests: SBI Liquid Fund (6.5% return, fund code 103438)
- Deep-links to Groww/Kuvera for one-click investment
- Reminder logic: 7 days if ignored, re-prompt

### Database: `idle_money_logs`
```
user_id, total_balance, reserved_amount, idle_amount, 
suggestion_text, action_taken, reminder_count
```

---

## 📊 TAX INTELLIGENCE

**Voice Trigger:** "tax batao" / "कर"

### Sub-features:

#### Tax Harvesting
- Tracks holding period for investments (FD, SIP, Crypto, Stocks)
- STCG vs LTCG detection (1 year threshold)
- Voice alert: "3 din ruko — kal bechoge toh LTCG ho jaayega, ₹4,200 tax bachega"
- Tax loss harvesting: matches gains with losses

#### Advance Tax Calculator
- 4 deadlines: June 15 (15%), Sept 15 (45%), Dec 15 (75%), March 15 (100%)
- Calculates from: salary + freelance income + investment gains + rental
- Shows: gross income, deductions (80C/80D/80CCD), taxable income, tax owed, TDS paid, balance
- 30-day push notification before each deadline

#### TDS Auto-Detection
- Single payment > ₹30,000 → "Is payment pe TDS kata hoga, Form 26AS mein check karo"
- Annual per client > ₹1,00,000 → "Client ko PAN dedo, Form 16A milega"

#### Form 26AS Reconciliation
- User enters TDS credits
- VAANI compares expected vs actual
- Mismatch alert: "Client X ne ₹5,000 dikhaya, aapne ₹7,000 expect kiya tha"

#### Year-end Tax Saving
- Jan 1 - March 31: unused 80C/80D/80CCD alerts
- Voice: "Aapka ₹45,000 80C limit baaki hai. ELSS mein lagaado"

### Database: `tax_records`, `tax_harvesting_alerts`

---

## 🧾 FREELANCER OS

**Voice Trigger:** "income log karo" / "कमाई"

### Sub-features:

#### Income Logging
- Voice: "Rahul ne ₹25,000 bheja project ke liye"
- Logs: client name, amount, date, category (freelance/gig/services)
- Supports: Swiggy/Zomato gig income, freelance payments, contract work

#### Client-wise Payment Tagging
- Dashboard: client name, total earned, last payment date, outstanding
- Auto-reminder: "Rahul ka ₹25,000 30 din se pending hai. Remind karo?"
- WhatsApp message draft generation

#### GST Invoice Generation
- Voice: "Rahul ke liye invoice banao, ₹30,000 ka, web design"
- Auto-generates invoice: number, date, client GSTIN, services, 18% GST
- PDF export, share via WhatsApp/email

#### ITR Data Export
- Year-end: compiles income by client, expenses, TDS, advance tax paid
- Exports CSV/PDF matching ITR-3 format for CA

#### TDS Threshold Detection
- Per client annual > ₹1,00,000 → PAN collection alert
- Single payment > ₹30,000 → TDS alert

### Database: `freelancer_incomes`, `freelancer_clients`, `freelancer_invoices`

---

## 🏦 FINANCIAL COMMAND CENTER

**Voice Trigger:** "daulat kitni hai" / "net worth"

### Sub-features:

#### Live Net Worth
- Assets: bank balance + FD value + MF portfolio (live NAV) + crypto (Binance) + gold + PPF
- Liabilities: home loan + car loan + personal loan + credit card + EMIs
- One big number at top, updates in real-time

#### Idle Money (Cross-Account)
- Same as Idle Money feature but across ALL connected accounts
- Aggregated view of total idle across banks

#### Full Debt Picture
- Log all EMIs: amount, tenure, interest rate, lender, remaining months
- Total monthly EMI burden calculation
- "EMI burden 45% of income - risky!" alert if >40%
- 3-day EMI due reminders
- Debt avalanche: highest interest first payoff strategy

#### FIRE Progress Tracker
- Voice: "50 saal mein retire karna hai, ₹5 crore chahiye"
- Shows: current net worth, target, monthly savings needed, years remaining
- Progress bar: "23% complete"
- Monthly impact: "Is mahine ₹8,000 extra kharcha = retirement 3 mahine door"

### Database: `net_worth_snapshots`, `fire_goals`, `debt_tracking`

---

## 🛒 SPEND AWARENESS

**Voice Trigger:** Purchase intent detection

### Sub-features:

#### Purchase Intent Check
- Trigger: user says "₹3,000 jacket kharidna hai"
- Before logging: "Kya aap sure hain? ₹3,000 agar 10 saal invested = ₹18,000 at 20% CAGR"
- If "haan" → log expense
- If "sochta hoon" → save as wishlist, remind in 7 days
- Only triggers for purchases > ₹500

#### Monthly Spend Summary
- 1st of month: last month's breakdown
- Voice: "Pichle mahine ₹28,000 kharcha — food ₹8,000, transport ₹4,000, shopping ₹6,000"
- Bar chart by category
- Month-over-month comparison
- Budget vs actual per category

### Database: `transactions`, `spending_analytics`

---

## 💳 CREDIT INTELLIGENCE

**Voice Trigger:** Credit card or loan mention

### Sub-features:

#### Portfolio-Backed Credit Line
- Voice: "Mujhe ₹50,000 emergency chahiye"
- Checks: MF holdings, FD value, gold
- Explains: "Aapke ₹2L MF pe ₹1.4L loan at 10.5% — credit card 36% se kam"
- Loan Against Mutual Fund (LAMF) explanation
- Redirects to bank/NBFC (no execution in VAANI)

#### Borrowing Capacity Calculator
- Formula: (monthlyIncome × 0.40) - existingEMIs = availableEMI
- Shows: max home loan, personal loan, credit card limit
- Voice: "Aapki income se ₹35 lakh home loan eligible ho"

#### Better-Than-Credit-Card Suggestions
- Credit card due → "FD overdraft lo, 2% sasta padega"
- Personal loan inquiry → "LAMF ya gold loan 10-12% vs personal loan 18%"
- Shows savings in ₹ not %: "₹10,000 bachenge 1 saal mein"

### Database: `credit_lines`, `borrowing_capacity`

---

## 🎙️ VOICE & CHAT SYSTEM

### 22 Languages Supported
Hindi, English, Bengali, Telugu, Tamil, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu + 11 more

### Voice Commands
| Command | Hindi | Feature |
|---------|-------|---------|
| "idle hai" | पैसा पड़ा | Idle Money |
| "tax batao" | कर | Tax Intelligence |
| "income log karo" | कमाई | Freelancer OS |
| "daulat kitni hai" | दौलत | Net Worth |
| "FD suggest karo" | - | FD Recommendation |
| "SIP recommend karo" | - | SIP Recommendation |
| "₹500 chai" | - | Add Expense |

### Chat Engine
- SSE streaming (word by word)
- AI Providers (fallback chain):
  1. MiniMax M2.7 (user's preferred)
  2. Groq Llama 3.1 70B (free tier)
  3. Gemini 2.0 Flash
- System prompts in user's language
- 150-word response limit

### TTS
- ElevenLabs (primary)
- MiniMax TTS (fallback)
- Voice in Hindi/English with regional accents

### STT
- MiniMax STT API
- Supports 22 languages
- Noise filtering for Indian accents

---

## 📈 LIVE DATA INTEGRATION

| Service | API | Data |
|---------|-----|------|
| AMFI India | api.mfapi.in | SIP NAV for 10,000+ funds |
| Binance | api.binance.com | Crypto prices (BTC, ETH, etc.) |
| FD Rates | Supabase + Scrapers | Real bank FD rates |
| Gold | metals-api | Live gold price |
| Exchange | exchangerate-api | INR/USD rates |

---

## 🗄️ DATABASE SCHEMA

### 9 Core Tables (RLS Enabled)
```
idle_money_logs          - Idle balance detection
tax_records              - Tax intelligence
tax_harvesting_alerts    - Tax harvesting opportunities
freelancer_incomes       - Freelancer income
freelancer_clients       - Client management
freelancer_invoices      - GST invoices
net_worth_snapshots      - Net worth tracking
fire_goals               - FIRE targets
debt_tracking            - EMI and loan tracking
```

### Performance
- Indexes on all user_id and date columns
- Auto-update triggers
- Real-time notifications via pg_notify

---

## 📱 TECH STACK

### Frontend
- React 18 + Vite
- Tailwind CSS
- PWA (manifest.json, service worker)
- Zustand for state management

### Backend
- Node.js + Express
- SSE for streaming
- Socket.io for real-time

### Database
- Supabase PostgreSQL
- Row Level Security (RLS)
- Real-time subscriptions

### Deployment
- Vercel (frontend)
- Render (server)
- Supabase (database)

---

## 🔒 SECURITY

- Supabase Auth (email/password)
- Row Level Security on all tables
- Environment variables for API keys
- No sensitive data in git

---

## ✅ FEATURE STATUS

| Feature | Status | Voice | Dashboard |
|---------|--------|-------|-----------|
| FD Recommendations | ✅ Done | ✅ | ✅ |
| SIP Recommendations | ✅ Done | ✅ | ✅ |
| Idle Money | ✅ Done | ✅ | ✅ |
| Tax Intelligence | ✅ Done | ✅ | ✅ |
| Freelancer OS | ✅ Done | ✅ | ✅ |
| Command Center | ✅ Done | ✅ | ✅ |
| Spend Awareness | ✅ Done | ✅ | ✅ |
| Credit Intelligence | ✅ Done | ✅ | ✅ |
| 22 Language Support | ✅ Done | ✅ | ✅ |
| Live Market Data | ✅ Done | ✅ | ✅ |
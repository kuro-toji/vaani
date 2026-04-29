# VAANI — Deployment Guide

## Quick Start

### 1. Supabase Setup
Go to [supabase.com](https://supabase.com) and create a project.

**Run migrations in Supabase SQL Editor:**
```
1. supabase/migrations/001_create_tables.sql
2. supabase/migrations/002_create_feature_tables.sql
```

### 2. Environment Variables
Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_DEV_AUTH=true
```

### 3. Install & Run
```bash
npm install
npm run dev
```

---

## Production Deployment

### Vercel
```bash
npm run build
vercel deploy
```

Add environment variables in Vercel dashboard.

---

## Features Implemented

### 💰 Idle Money Detection
- Detects idle balance across accounts
- Voice: "₹12,000 idle hai, liquid fund mein lagaein?"
- Tables: `idle_money_logs`

### 📊 Tax Intelligence
- Advance tax calculator with 4 deadlines
- Tax harvesting reminders
- 80C/80D/80CCD suggestions
- Tables: `tax_records`, `tax_harvesting_alerts`

### 🧾 Freelancer OS
- Income logging by voice
- Client-wise tracking
- GST invoice generation
- Tables: `freelancer_incomes`, `freelancer_clients`, `freelancer_invoices`

### 🏦 Financial Command Center
- Net worth tracking
- FIRE progress calculator
- Debt tracking
- Tables: `net_worth_snapshots`, `fire_goals`, `debt_tracking`

---

## API Integrations

| Service | API | Rate Limit |
|---------|-----|------------|
| AMFI (SIP NAV) | api.mfapi.in | 100/min |
| Binance (Crypto) | api.binance.com | 1200/min |
| Exchange Rate | exchangerate-api.com | 1500/month |

---

## Voice Commands

| Feature | Hindi | English |
|---------|-------|---------|
| Idle Money | "idle hai" | "idle money" |
| Tax | "tax batao" | "tax summary" |
| Freelancer | "income log karo" | "log income" |
| Net Worth | "daulat kitni hai" | "net worth" |

---

## Database Schema

All tables have Row Level Security (RLS) enabled.
Users can only access their own data.

Run this in Supabase SQL Editor:
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

---

## Support

For issues: https://github.com/kuro-toji/vaani/issues
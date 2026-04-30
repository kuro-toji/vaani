-- ═══════════════════════════════════════════════════════════════════
-- VAANI Market Data Cache Tables
-- Layer 1: Server-side market data pipeline
-- ═══════════════════════════════════════════════════════════════════

-- FD Rates Cache — updated daily by cron job
CREATE TABLE IF NOT EXISTS fd_rates (
  id BIGSERIAL PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  bank_code VARCHAR(20) NOT NULL,
  tenure_days INTEGER NOT NULL,
  rate DECIMAL(5,3) NOT NULL,
  senior_rate DECIMAL(5,3) NOT NULL,
  min_amount INTEGER DEFAULT 1000,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bank_code, tenure_days)
);

-- MF NAV Cache — updated daily at 5pm
CREATE TABLE IF NOT EXISTS mf_nav_cache (
  id BIGSERIAL PRIMARY KEY,
  scheme_code INTEGER UNIQUE NOT NULL,
  scheme_name VARCHAR(255) NOT NULL,
  nav DECIMAL(10,4) NOT NULL,
  nav_date DATE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Cache Metadata — tracks last update times
CREATE TABLE IF NOT EXISTS market_cache_metadata (
  id SERIAL PRIMARY KEY,
  cache_type VARCHAR(50) UNIQUE NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  records_count INTEGER DEFAULT 0,
  error_message TEXT
);

-- Crypto Price Fallback Cache — 3-layer fallback support
CREATE TABLE IF NOT EXISTS crypto_price_cache (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  base_asset VARCHAR(20) NOT NULL,
  price_usd DECIMAL(15,6) NOT NULL,
  price_inr DECIMAL(15,2) NOT NULL,
  change_24h DECIMAL(8,4),
  source VARCHAR(20) NOT NULL, -- 'binance', 'coingecko', 'manual'
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- USD/INR Exchange Rate Cache
CREATE TABLE IF NOT EXISTS exchange_rate_cache (
  id SERIAL PRIMARY KEY,
  base_currency VARCHAR(10) DEFAULT 'USD',
  target_currency VARCHAR(10) DEFAULT 'INR',
  rate DECIMAL(10,4) NOT NULL,
  source VARCHAR(50) DEFAULT 'exchangerate-api',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(base_currency, target_currency)
);

-- Gold Price Cache
CREATE TABLE IF NOT EXISTS gold_price_cache (
  id SERIAL PRIMARY KEY,
  price_per_gram_inr DECIMAL(10,2) NOT NULL,
  price_per_tola_inr DECIMAL(10,2), -- 11.66gm = 1 tola
  source VARCHAR(50) DEFAULT 'metals-api',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- User Financial Context Cache — Layer 2
CREATE TABLE IF NOT EXISTS user_financial_context (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  context_json JSONB NOT NULL,
  net_worth DECIMAL(15,2),
  fd_count INTEGER DEFAULT 0,
  sip_count INTEGER DEFAULT 0,
  crypto_count INTEGER DEFAULT 0,
  monthly_income DECIMAL(12,2),
  tax_bracket VARCHAR(20),
  fire_goal DECIMAL(15,2),
  fire_target_year INTEGER,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- API Usage Logs — Layer 10 observability
CREATE TABLE IF NOT EXISTS api_logs (
  id BIGSERIAL PRIMARY KEY,
  endpoint VARCHAR(100) NOT NULL,
  user_id_hash VARCHAR(64), -- hashed for privacy
  response_time_ms INTEGER,
  ai_provider VARCHAR(20),
  success BOOLEAN DEFAULT true,
  error_code VARCHAR(20),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint);

-- Subscriptions Table — Layer 9
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL, -- 'free', 'premium'
  status VARCHAR(20) NOT NULL, -- 'active', 'cancelled', 'past_due'
  razorpay_subscription_id VARCHAR(100),
  razorpay_customer_id VARCHAR(100),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Freelancer Clients — Layer 6
CREATE TABLE IF NOT EXISTS freelancer_clients (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name VARCHAR(100) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(20),
  gstin VARCHAR(15),
  annual_total DECIMAL(12,2) DEFAULT 0,
  last_payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, client_name)
);

-- Freelancer Incomes — Layer 6
CREATE TABLE IF NOT EXISTS freelancer_incomes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES freelancer_clients(id),
  amount DECIMAL(12,2) NOT NULL,
  type VARCHAR(30) NOT NULL, -- 'project_payment', 'retainer', 'consultation'
  description TEXT,
  invoice_number VARCHAR(20),
  invoice_url TEXT,
  date DATE NOT NULL,
  gst_amount DECIMAL(12,2) DEFAULT 0,
  tds_deducted DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idle Money Logs — Layer 5
CREATE TABLE IF NOT EXISTS idle_money_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_balance DECIMAL(15,2) NOT NULL,
  reserved_amount DECIMAL(15,2) NOT NULL,
  idle_amount DECIMAL(15,2) NOT NULL,
  suggestion_text TEXT,
  action_taken VARCHAR(30) DEFAULT 'pending', -- 'pending', 'invested', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debt Tracking — Layer 7
CREATE TABLE IF NOT EXISTS debt_tracking (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_type VARCHAR(30) NOT NULL, -- 'home_loan', 'personal_loan', 'car_loan', 'credit_card', 'education_loan'
  lender_name VARCHAR(100),
  principal_amount DECIMAL(12,2) NOT NULL,
  outstanding_amount DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(6,3) NOT NULL,
  emi_amount DECIMAL(10,2),
  emi_due_date INTEGER, -- day of month
  tenure_months INTEGER,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes for Performance ─────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fd_rates_bank ON fd_rates(bank_code);
CREATE INDEX IF NOT EXISTS idx_fd_rates_tenure ON fd_rates(tenure_days);
CREATE INDEX IF NOT EXISTS idx_mf_nav_scheme ON mf_nav_cache(scheme_code);
CREATE INDEX IF NOT EXISTS idx_mf_nav_date ON mf_nav_cache(nav_date);
CREATE INDEX IF NOT EXISTS idx_crypto_symbol ON crypto_price_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_user_context_user ON user_financial_context(user_id);
CREATE INDEX IF NOT EXISTS idx_idle_user ON idle_money_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_user ON debt_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_income_user ON freelancer_incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- ─── Seed Initial FD Data ──────────────────────────────────────────
INSERT INTO fd_rates (bank_name, bank_code, tenure_days, rate, senior_rate, min_amount) VALUES
  ('State Bank of India', 'SBI', 365, 6.80, 7.30, 1000),
  ('State Bank of India', 'SBI', 730, 7.00, 7.50, 1000),
  ('State Bank of India', 'SBI', 1095, 6.75, 7.25, 1000),
  ('Bank of Baroda', 'BOB', 365, 6.85, 7.35, 1000),
  ('Bank of Baroda', 'BOB', 730, 7.15, 7.65, 1000),
  ('Bank of Baroda', 'BOB', 1095, 7.00, 7.50, 1000),
  ('HDFC Bank', 'HDFC', 365, 7.10, 7.60, 1000),
  ('HDFC Bank', 'HDFC', 730, 7.20, 7.70, 1000),
  ('HDFC Bank', 'HDFC', 1095, 7.00, 7.50, 1000),
  ('ICICI Bank', 'ICICI', 365, 7.10, 7.60, 1000),
  ('ICICI Bank', 'ICICI', 730, 7.20, 7.70, 1000),
  ('ICICI Bank', 'ICICI', 1095, 7.00, 7.50, 1000),
  ('Axis Bank', 'Axis', 365, 7.10, 7.60, 1000),
  ('Axis Bank', 'Axis', 730, 7.26, 7.76, 1000),
  ('Axis Bank', 'Axis', 1095, 7.10, 7.60, 1000),
  ('Yes Bank', 'YES', 365, 7.75, 8.25, 1000),
  ('Yes Bank', 'YES', 730, 7.75, 8.25, 1000),
  ('Yes Bank', 'YES', 1095, 7.25, 7.75, 1000),
  ('IndusInd Bank', 'INDUS', 365, 7.99, 8.49, 1000),
  ('IndusInd Bank', 'INDUS', 730, 7.75, 8.25, 1000),
  ('IndusInd Bank', 'INDUS', 1095, 7.25, 7.75, 1000),
  ('Suryoday Small Finance Bank', 'SURYODAY', 365, 9.10, 9.60, 1000),
  ('Suryoday Small Finance Bank', 'SURYODAY', 730, 8.60, 9.10, 1000),
  ('Suryoday Small Finance Bank', 'SURYODAY', 1095, 8.25, 8.75, 1000),
  ('Utkarsh Small Finance Bank', 'UTKARSH', 365, 8.50, 9.00, 1000),
  ('Utkarsh Small Finance Bank', 'UTKARSH', 730, 8.25, 8.75, 1000),
  ('Utkarsh Small Finance Bank', 'UTKARSH', 1095, 8.00, 8.50, 1000),
  ('AU Small Finance Bank', 'AU', 365, 8.00, 8.50, 1000),
  ('AU Small Finance Bank', 'AU', 730, 7.75, 8.25, 1000),
  ('AU Small Finance Bank', 'AU', 1095, 7.50, 8.00, 1000)
ON CONFLICT (bank_code, tenure_days) DO UPDATE SET
  rate = EXCLUDED.rate,
  senior_rate = EXCLUDED.senior_rate,
  last_updated = NOW();

-- Mark cache as ready
INSERT INTO market_cache_metadata (cache_type, status, records_count)
VALUES ('fd_rates', 'ready', 30)
ON CONFLICT (cache_type) DO UPDATE SET
  last_updated = NOW(),
  records_count = 30,
  status = 'ready';
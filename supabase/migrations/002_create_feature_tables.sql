-- VAANI Feature Tables - Production Ready
-- Run these in Supabase SQL Editor

-- ─── Idle Money Detection ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS idle_money_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  total_balance DECIMAL(15,2) NOT NULL,
  reserved_amount DECIMAL(15,2) NOT NULL,
  idle_amount DECIMAL(15,2) NOT NULL,
  suggestion_text TEXT,
  action_taken VARCHAR(20) DEFAULT 'pending', -- pending, invested, reminded, ignored
  reminder_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Tax Intelligence ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tax_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  financial_year VARCHAR(10) NOT NULL,
  annual_income DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  taxable_income DECIMAL(15,2) DEFAULT 0,
  total_tax DECIMAL(15,2) DEFAULT 0,
  existing_tds DECIMAL(15,2) DEFAULT 0,
  balance_tax DECIMAL(15,2) DEFAULT 0,
  deductions_80c DECIMAL(15,2) DEFAULT 0,
  deductions_80d DECIMAL(15,2) DEFAULT 0,
  deductions_80ccd1b DECIMAL(15,2) DEFAULT 0,
  advance_tax_deadlines JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tax_harvesting_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  investment_id VARCHAR(100),
  investment_type VARCHAR(20), -- fd, sip, crypto, stock
  purchase_price DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  holding_days INTEGER NOT NULL,
  potential_gain DECIMAL(15,2) NOT NULL,
  potential_tax_saving DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, executed, dismissed
  alert_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Freelancer OS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS freelancer_incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  client_name VARCHAR(100) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  net_amount DECIMAL(15,2),
  tds_amount DECIMAL(15,2) DEFAULT 0,
  tds_applicable BOOLEAN DEFAULT FALSE,
  description TEXT,
  category VARCHAR(50) DEFAULT 'freelance',
  payment_date DATE NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'bank',
  status VARCHAR(20) DEFAULT 'received', -- pending, received, overdue
  invoice_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS freelancer_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  gstin VARCHAR(20),
  address TEXT,
  annual_total DECIMAL(15,2) DEFAULT 0,
  tds_certificate_collected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS freelancer_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID REFERENCES freelancer_clients(id),
  client_name VARCHAR(100) NOT NULL,
  services JSONB NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  sgst DECIMAL(15,2) DEFAULT 0,
  cgst DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  gstin VARCHAR(20),
  your_gstin VARCHAR(20),
  status VARCHAR(20) DEFAULT 'draft', -- draft, sent, paid, cancelled
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ─── Financial Command Center ───────────────────────────────────
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  snapshot_date DATE DEFAULT CURRENT_DATE,
  total_assets DECIMAL(15,2) DEFAULT 0,
  total_liabilities DECIMAL(15,2) DEFAULT 0,
  net_worth DECIMAL(15,2) DEFAULT 0,
  assets_breakdown JSONB DEFAULT '{}',
  liabilities_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fire_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  fire_number DECIMAL(15,2) NOT NULL,
  target_age INTEGER NOT NULL,
  current_age INTEGER DEFAULT 30,
  monthly_expenses DECIMAL(15,2) DEFAULT 30000,
  inflation_rate DECIMAL(5,2) DEFAULT 6.00,
  status VARCHAR(20) DEFAULT 'active',
  achieved_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debt_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  debt_type VARCHAR(50) NOT NULL, -- home_loan, car_loan, personal_loan, credit_card, other
  lender_name VARCHAR(100),
  outstanding_amount DECIMAL(15,2) NOT NULL,
  emi_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  tenure_months INTEGER,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── Row Level Security ──────────────────────────────────────────
ALTER TABLE idle_money_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_harvesting_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE fire_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can manage own idle money logs" ON idle_money_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tax records" ON tax_records FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tax harvesting alerts" ON tax_harvesting_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own freelancer incomes" ON freelancer_incomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own freelancer clients" ON freelancer_clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own freelancer invoices" ON freelancer_invoices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own net worth snapshots" ON net_worth_snapshots FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own fire goals" ON fire_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own debt tracking" ON debt_tracking FOR ALL USING (auth.uid() = user_id);

-- ─── Indexes for Performance ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_idle_money_user ON idle_money_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_records_user_year ON tax_records(user_id, financial_year);
CREATE INDEX IF NOT EXISTS idx_freelancer_incomes_user_date ON freelancer_incomes(user_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_freelancer_clients_user ON freelancer_clients(user_id);
CREATE INDEX IF NOT EXISTS idx_net_worth_user_date ON net_worth_snapshots(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_fire_goals_user ON fire_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_debt_tracking_user ON debt_tracking(user_id);

-- ─── Functions ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at
CREATE TRIGGER update_idle_money_updated_at BEFORE UPDATE ON idle_money_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_tax_records_updated_at BEFORE UPDATE ON tax_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_freelancer_incomes_updated_at BEFORE UPDATE ON freelancer_incomes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_freelancer_clients_updated_at BEFORE UPDATE ON freelancer_clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_fire_goals_updated_at BEFORE UPDATE ON fire_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_debt_tracking_updated_at BEFORE UPDATE ON debt_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Notifications ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_feature_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('feature_change', json_build_object('table', TG_TABLE_NAME, 'user_id', NEW.user_id, 'action', TG_OP)::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_idle_money_change ON idle_money_logs AFTER INSERT OR UPDATE FOR EACH ROW EXECUTE FUNCTION notify_feature_change();
CREATE TRIGGER notify_tax_records_change ON tax_records AFTER INSERT OR UPDATE FOR EACH ROW EXECUTE FUNCTION notify_feature_change();
CREATE TRIGGER notify_freelancer_incomes_change ON freelancer_incomes AFTER INSERT OR UPDATE FOR EACH ROW EXECUTE FUNCTION notify_feature_change();
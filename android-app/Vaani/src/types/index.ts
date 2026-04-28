// User & Auth Types
export interface User {
  id: string;
  email?: string;
  phone?: string;
  created_at: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  preferred_lang: string;
  vaani_score: number;
  visual_mode: 'normal' | 'large_text' | 'traffic_light';
  haptic_enabled: boolean;
  slow_speech: boolean;
}

// Money Management Types
export interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  type: 'credit' | 'debit';
  date: string;
  created_at: string;
}

export type ExpenseCategory = 
  | 'food' 
  | 'transport' 
  | 'utilities' 
  | 'entertainment' 
  | 'health' 
  | 'education' 
  | 'shopping' 
  | 'investment' 
  | 'other';

export interface Budget {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  monthly_limit: number;
  spent: number;
  month: string; // YYYY-MM format
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  created_at: string;
}

// Investment Types
export interface FDInvestment {
  id: string;
  user_id: string;
  bank: string;
  principal: number;
  current_value: number;
  rate: number;
  maturity_date: string;
  tenure_months: number;
  start_date: string;
  created_at: string;
}

export interface SIPInvestment {
  id: string;
  user_id: string;
  fund: string;
  principal: number;
  current_value: number;
  monthly: number;
  units: number;
  nav: number;
  start_date: string;
  created_at: string;
}

export interface CryptoWallet {
  id: string;
  user_id: string;
  coin: string;
  symbol: string;
  amount: number;
  current_value: number;
  buy_price: number;
  blockchain: string;
  created_at: string;
}

export interface GoldHolding {
  id: string;
  user_id: string;
  grams: number;
  buy_price: number;
  current_price: number;
  updated_at: string;
}

// Transaction Types
export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category?: string;
  date: string;
  created_at: string;
}

// Net Worth
export interface NetWorth {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  breakdown: {
    fd: number;
    sip: number;
    crypto: number;
    gold: number;
    savings: number;
  };
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audio_url?: string;
  created_at: string;
}

// Language Types
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'devanagari', direction: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'bengali', direction: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'tamil', direction: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'telugu', direction: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'devanagari', direction: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'gujarati', direction: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'kannada', direction: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'malayalam', direction: 'ltr' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'gurmukhi', direction: 'ltr' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'oriya', direction: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'arabic', direction: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English', script: 'latin', direction: 'ltr' },
];

// Dialect Metaphors
export const DIALECT_METAPHORS: Record<string, Record<string, string>> = {
  hi: {
    'FD': 'गल्ला बंद (Fixed Deposit)',
    'SIP': 'हफ्तेवाला बचत (Systematic Investment)',
    'gold': 'सोना',
    'expense': 'खर्चा',
    'savings': 'बचत',
    'budget': 'मासिक खर्चा',
  },
  en: {
    'FD': 'Fixed Deposit',
    'SIP': 'Monthly Investment',
    'gold': 'Gold',
    'expense': 'Expense',
    'savings': 'Savings',
    'budget': 'Budget',
  },
};

// ═══════════════════════════════════════════════════════════════════
// FEATURE MODULE TYPES — Idle Money, Tax, Freelancer, Command Center,
// Spend Awareness, Credit Intelligence
// ═══════════════════════════════════════════════════════════════════

// ─── 1. Idle Money Management ────────────────────────────────────
export interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_type: 'savings' | 'current' | 'salary';
  balance: number;
  last_updated: string;
  is_primary: boolean;
  created_at: string;
}

export interface IdleMoneyDetection {
  id: string;
  user_id: string;
  detected_amount: number;
  total_balance: number;
  upcoming_emis: number;
  monthly_budget: number;
  emergency_buffer: number;
  detection_date: string;
  action_taken: 'ignored' | 'invested' | 'reminded' | 'pending';
  reminder_count: number;
  suggested_product: string;
  created_at: string;
}

// ─── 2. Tax Intelligence ─────────────────────────────────────────
export type TaxGainType = 'STCG' | 'LTCG';

export interface InvestmentHolding {
  id: string;
  user_id: string;
  asset_type: 'mutual_fund' | 'stock' | 'fd' | 'gold' | 'crypto';
  asset_name: string;
  buy_date: string;
  buy_price: number;
  current_price: number;
  quantity: number;
  gain_loss: number;
  gain_type: TaxGainType;
  holding_days: number;
  created_at: string;
}

export interface TaxHarvestingOpportunity {
  holding_id: string;
  asset_name: string;
  gain_type: TaxGainType;
  gain_amount: number;
  tax_at_current: number;
  tax_if_wait: number;
  savings: number;
  days_to_ltcg: number;
  recommendation: string;
}

export interface AdvanceTaxDeadline {
  quarter: 1 | 2 | 3 | 4;
  deadline_date: string;
  cumulative_percent: number; // 15, 45, 75, 100
  estimated_income: number;
  tax_due: number;
  already_paid: number;
  balance_due: number;
  days_remaining: number;
}

export interface Section80CTracker {
  user_id: string;
  total_limit: number;  // 1,50,000
  utilized: number;
  remaining: number;
  breakdown: {
    epf: number;
    ppf: number;
    elss: number;
    life_insurance: number;
    nsc: number;
    tuition_fees: number;
    home_loan_principal: number;
    other: number;
  };
  suggestions: string[];
}

export interface TDSRecord {
  id: string;
  user_id: string;
  payer_name: string;
  amount: number;
  tds_amount: number;
  tds_rate: number;
  payment_date: string;
  financial_year: string;
  form_26as_verified: boolean;
  mismatch_amount: number;
  created_at: string;
}

// ─── 3. Freelancer OS ────────────────────────────────────────────
export interface FreelancerIncome {
  id: string;
  user_id: string;
  client_name: string;
  amount: number;
  description: string;
  payment_date: string;
  payment_method: 'bank_transfer' | 'upi' | 'cash' | 'cheque' | 'other';
  tds_deducted: number;
  is_tds_applicable: boolean;
  invoice_id?: string;
  financial_year: string;
  created_at: string;
}

export interface ClientTracker {
  client_name: string;
  total_paid: number;
  total_pending: number;
  last_payment_date: string;
  payment_count: number;
  tds_total: number;
  days_since_last_payment: number;
}

export interface GSTInvoice {
  id: string;
  user_id: string;
  invoice_number: string;
  client_name: string;
  client_gstin?: string;
  service_description: string;
  amount: number;
  gst_rate: number;  // 18% default
  gst_amount: number;
  total_amount: number;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  your_gstin?: string;
  your_bank_details?: string;
  created_at: string;
}

export interface ITRExportData {
  financial_year: string;
  total_income: number;
  income_by_client: { client: string; amount: number }[];
  total_expenses: number;
  tds_deducted: number;
  advance_tax_paid: number;
  taxable_income: number;
  estimated_tax: number;
}

// ─── 4. Financial Command Center ─────────────────────────────────
export interface Loan {
  id: string;
  user_id: string;
  loan_type: 'home' | 'car' | 'personal' | 'education' | 'gold' | 'credit_card' | 'other';
  lender_name: string;
  principal: number;
  outstanding: number;
  interest_rate: number;
  emi_amount: number;
  emi_date: number; // day of month 1-28
  remaining_tenure_months: number;
  start_date: string;
  total_interest_remaining: number;
  created_at: string;
}

export interface DebtSummary {
  total_outstanding: number;
  total_monthly_emi: number;
  total_interest_remaining: number;
  debt_to_income_ratio: number;
  loans: Loan[];
  prepayment_suggestion?: {
    loan_id: string;
    loan_type: string;
    reason: string;
    interest_saved: number;
  };
}

export interface FIRETracker {
  user_id: string;
  target_amount: number;
  target_age: number;
  current_age: number;
  current_net_worth: number;
  monthly_savings_needed: number;
  years_remaining: number;
  progress_percent: number;
  monthly_spending_impact: number; // extra spend → retirement delayed by X months
}

export interface ExtendedNetWorth {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  breakdown: {
    bank_balances: number;
    fd: number;
    sip: number;
    ppf: number;
    crypto: number;
    gold: number;
    savings_goals: number;
  };
  liabilities_breakdown: {
    home_loan: number;
    car_loan: number;
    personal_loan: number;
    credit_card: number;
    other: number;
  };
  monthly_income: number;
  monthly_expense: number;
  monthly_emi: number;
  monthly_savings: number;
}

// ─── 5. Spend Awareness ─────────────────────────────────────────
export interface PurchaseIntent {
  id: string;
  user_id: string;
  item_description: string;
  amount: number;
  opportunity_cost_10yr: number;
  decision: 'bought' | 'skipped' | 'wishlist' | 'pending';
  wishlist_remind_date?: string;
  created_at: string;
}

export interface MonthlySpendSummary {
  month: string;  // YYYY-MM
  total_spent: number;
  total_income: number;
  total_saved: number;
  by_category: { category: string; amount: number; percent: number; vs_budget: 'under' | 'over' | 'on_track'; budget_limit: number }[];
  vs_previous_month: number; // + or - difference
  top_expense: { category: string; amount: number };
  voice_summary: string;  // ready-to-speak Hindi summary
}

// ─── 6. Credit Intelligence ──────────────────────────────────────
export interface CreditOption {
  type: 'lamf' | 'fd_overdraft' | 'gold_loan' | 'personal_loan' | 'credit_card';
  name: string;
  interest_rate: number;
  max_available: number;
  collateral_required: string;
  processing_time: string;
  explanation: string; // voice-friendly explanation
}

export interface BorrowingCapacity {
  monthly_income: number;
  existing_emis: number;
  available_emi_capacity: number;
  max_home_loan: number;
  max_personal_loan: number;
  max_credit_limit: number;
  portfolio_backed_amount: number;
  credit_score?: number;
}

export interface CreditComparison {
  need_amount: number;
  options: CreditOption[];
  best_option: CreditOption;
  total_savings_vs_credit_card: number;
  voice_explanation: string;
}

// Settings Types
export interface AppSettings {
  visual_mode: 'normal' | 'large_text' | 'traffic_light';
  language: string;
  haptic_enabled: boolean;
  slow_speech: boolean;
  continuous_listening: boolean;
  wake_word: boolean;
  notifications_enabled: boolean;
  offline_mode: boolean;
}

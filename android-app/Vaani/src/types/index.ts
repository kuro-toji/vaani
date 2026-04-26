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

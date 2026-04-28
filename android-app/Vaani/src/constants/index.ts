// Color Palette - OLED Dark Theme
export const COLORS = {
  // Background
  bg_base: '#080808',
  bg_surface: '#111111',
  bg_elevated: '#1A1A1A',
  
  // Borders
  border_subtle: 'rgba(255,255,255,0.06)',
  border_active: 'rgba(255,255,255,0.12)',
  border_focus: 'rgba(255,255,255,0.20)',
  
  // Primary - Green
  primary: '#1D9E75',
  primary_hover: '#1EB385',
  primary_muted: 'rgba(29,158,117,0.15)',
  primary_glow: 'rgba(29,158,117,0.25)',
  
  // Accent - Purple
  accent: '#6366F1',
  accent_muted: 'rgba(99,102,241,0.15)',
  accent_glow: 'rgba(99,102,241,0.20)',
  
  // Orange
  orange: '#FF6B00',
  
  // Text
  text_primary: '#FFFFFF',
  text_secondary: '#A1A1AA',
  text_tertiary: '#52525B',
  text_inverse: '#080808',
  
  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  // Glass
  glass_bg: 'rgba(255,255,255,0.04)',
  glass_border: 'rgba(255,255,255,0.06)',
};

// API Configuration
export const API_CONFIG = {
  // Supabase
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Groq - for Whisper STT
  GROQ_API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || '',
  GROQ_WHISPER_URL: 'https://api.groq.com/openai/v1/audio/transcriptions',
  
  // MiniMax - for AI Chat
  MINIMAX_API_KEY: process.env.EXPO_PUBLIC_MINIMAX_API_KEY || '',
  MINIMAX_API_URL: 'https://api.minimax.chat/v1/text/chatcompletion_v2',
  
  // ElevenLabs - for TTS
  ELEVENLABS_API_KEY: process.env.EXPO_PUBLIC_ELEVENLABS_API_KEY || '',
  ELEVENLABS_URL: 'https://api.elevenlabs.io/v1',
  
  // Moralis - for Crypto prices
  MORALIS_API_KEY: process.env.EXPO_PUBLIC_MORALIS_API_KEY || '',
  MORALIS_URL: 'https://deep-index.moralis.io/api/v2.2',
  
  // Metals API - for Gold prices
  METALS_API_KEY: process.env.EXPO_PUBLIC_METALS_API_KEY || 'demo',
  METALS_API_URL: 'https://metals-api.com/api',
};

// Voice Settings
export const VOICE_CONFIG = {
  // STT (Speech to Text) - Using Groq Whisper
  stt_provider: 'groq', // 'groq' | 'expo'
  
  // TTS (Text to Speech) - Using ElevenLabs
  tts_provider: 'elevenlabs', // 'elevenlabs' | 'expo'
  
  // Voice settings
  default_voice_rate: 0.9,
  slow_speech_rate: 0.7,
  
  // Voice Activity Detection
  vadSilenceThreshold: 500, // ms of silence to stop
  vadEnergyThreshold: 0.01,
  
  // Wake word
  wake_word: 'hey vaani',
  
  // Auto-send countdown
  auto_send_countdown: 2000, // 2 seconds
};

// App Configuration
export const APP_CONFIG = {
  name: 'VAANI',
  tagline: "India's Voice-First Financial Advisor",
  
  // Feature flags
  features: {
    voice_chat: true,
    expense_tracker: true,
    fd_tracker: true,
    sip_tracker: true,
    crypto_tracker: true,
    gold_tracker: true,
    budget_planner: true,
    savings_goals: true,
    notifications: true,
    offline_mode: true,
    accessibility: true,
  },
  
  // Limits
  max_expenses_per_day: 100,
  max_voice_messages_per_day: 500,
  
  // Cache settings
  cache_expiry: 5 * 60 * 1000, // 5 minutes
};

// Dialect metaphors by region
export const REGIONAL_METAPHORS = {
  bhojpuri: {
    money: 'पैसा',
    save: 'जोड़ल',
    spend: 'खर्च कइल',
    bank: 'बैंक',
    interest: 'ब्याज',
  },
  awadhi: {
    money: 'रुपया',
    save: 'जमा करी',
    spend: 'खर्च कइल',
    bank: 'बैंक',
    interest: 'ब्याज',
  },
  maithili: {
    money: 'मुद्दा',
    save: 'बचत',
    spend: 'खर्च',
    bank: 'बैंक',
    interest: 'ब्याज',
  },
  bundeli: {
    money: 'पैसा',
    save: 'जमा करो',
    spend: 'खर्च करो',
    bank: 'बैंक',
    interest: 'ब्याज',
  },
  rajasthani: {
    money: 'रुपया',
    save: 'बचावो',
    spend: 'खर्च करो',
    bank: 'बैंक',
    interest: 'मुनाफो',
  },
};

// Expense Categories with icons
export const EXPENSE_CATEGORIES = [
  { key: 'food', label: 'Food', icon: '🍔', color: '#FF6B00' },
  { key: 'transport', label: 'Transport', icon: '🚌', color: '#6366F1' },
  { key: 'utilities', label: 'Utilities', icon: '💡', color: '#F59E0B' },
  { key: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#EC4899' },
  { key: 'health', label: 'Health', icon: '💊', color: '#10B981' },
  { key: 'education', label: 'Education', icon: '📚', color: '#3B82F6' },
  { key: 'shopping', label: 'Shopping', icon: '🛍️', color: '#8B5CF6' },
  { key: 'investment', label: 'Investment', icon: '💰', color: '#1D9E75' },
  { key: 'other', label: 'Other', icon: '📦', color: '#6B7280' },
];

// Budget alerts
export const BUDGET_ALERTS = {
  warning_threshold: 0.8, // 80%
  danger_threshold: 1.0, // 100%
};

// Notification channels
export const NOTIFICATION_CHANNELS = {
  budget_alerts: 'budget_alerts',
  fd_maturity: 'fd_maturity',
  sip_reminders: 'sip_reminders',
  savings_milestones: 'savings_milestones',
  weekly_summary: 'weekly_summary',
};

// Supported Languages (also exported from types)
import { SUPPORTED_LANGUAGES } from '../types';
export { SUPPORTED_LANGUAGES };

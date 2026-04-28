// ═══════════════════════════════════════════════════════════════════
// VAANI Voice Command Service — All feature modules integrated
// Wake word: "Hey Vaani" / "हे वाणी"
// ═══════════════════════════════════════════════════════════════════

import { VOICE_CONFIG } from '../constants';

export interface VoiceCommand {
  id: string;
  patterns: string[];
  action: VoiceAction;
  description: string;
  module: 'nav' | 'core' | 'idle_money' | 'tax' | 'freelancer' | 'command_center' | 'spend' | 'credit';
}

export type VoiceAction =
  // Navigation
  | 'navigate_dashboard' | 'navigate_chat' | 'navigate_portfolio' | 'navigate_expenses' | 'navigate_back'
  // Core
  | 'repeat_response' | 'confirm' | 'cancel' | 'help' | 'open_settings'
  | 'read_fd_rates' | 'read_crypto_prices' | 'read_expenses' | 'read_sip_value' | 'read_balance' | 'add_expense'
  // Idle Money
  | 'check_idle_money' | 'update_balance' | 'invest_idle_money'
  // Tax Intelligence
  | 'check_tax_harvest' | 'advance_tax_status' | 'check_80c' | 'tax_saving_tips'
  // Freelancer OS
  | 'log_income' | 'client_summary' | 'generate_invoice' | 'itr_export' | 'income_summary'
  // Command Center
  | 'read_net_worth' | 'debt_summary' | 'fire_progress' | 'add_loan' | 'add_emi'
  // Spend Awareness
  | 'purchase_check' | 'monthly_summary' | 'opportunity_cost'
  // Credit Intelligence
  | 'credit_options' | 'borrowing_capacity' | 'cheaper_than_cc';

// ─── Voice Command Definitions ───────────────────────────────────
export const VOICE_COMMANDS: VoiceCommand[] = [
  // ── Navigation ──
  { id: 'nav_dashboard', patterns: ['dashboard dikhao', 'show dashboard', 'डैशबोर्ड दिखाओ', 'home'], action: 'navigate_dashboard', description: 'Navigate to dashboard', module: 'nav' },
  { id: 'nav_chat', patterns: ['chat kholao', 'open chat', 'चैट खोलो'], action: 'navigate_chat', description: 'Open chat screen', module: 'nav' },
  { id: 'nav_portfolio', patterns: ['portfolio dikhao', 'show portfolio', 'निवेश दिखाओ'], action: 'navigate_portfolio', description: 'View investment portfolio', module: 'nav' },
  { id: 'nav_expenses', patterns: ['kharcha dikhao', 'show expenses', 'खर्चा दिखाओ'], action: 'navigate_expenses', description: 'View expenses', module: 'nav' },
  { id: 'nav_back', patterns: ['wapas jao', 'go back', 'वापस जाओ'], action: 'navigate_back', description: 'Go back', module: 'nav' },

  // ── Core ──
  { id: 'repeat', patterns: ['phir se batao', 'repeat that', 'फिर से बताओ'], action: 'repeat_response', description: 'Repeat last response', module: 'core' },
  { id: 'confirm_yes', patterns: ['haan', 'yes', 'confirm', 'जी हाँ', 'theek hai', 'kar do'], action: 'confirm', description: 'Confirm action', module: 'core' },
  { id: 'confirm_no', patterns: ['nahi', 'no', 'cancel', 'नहीं', 'rehne do', 'mat karo'], action: 'cancel', description: 'Cancel action', module: 'core' },
  { id: 'fd_rates', patterns: ['FD rates batao', 'fixed deposit rates', 'गल्ला बंद दरें', 'fd rate'], action: 'read_fd_rates', description: 'Read FD rates', module: 'core' },
  { id: 'crypto', patterns: ['crypto price', 'bitcoin bhav', 'क्रिप्टो भाव', 'bitcoin price'], action: 'read_crypto_prices', description: 'Read crypto prices', module: 'core' },
  { id: 'expenses', patterns: ['kitna kharcha hua', 'total expenses', 'खर्चा कितना हुआ', 'mahine ka kharcha'], action: 'read_expenses', description: 'Read total expenses', module: 'core' },
  { id: 'sip_value', patterns: ['SIP kitna hai', 'SIP value', 'सिप कितना है', 'mutual fund value'], action: 'read_sip_value', description: 'Read SIP value', module: 'core' },
  { id: 'balance', patterns: ['baki balance', 'balance batao', 'शेष राशि', 'kitna paisa hai'], action: 'read_balance', description: 'Read savings balance', module: 'core' },
  { id: 'add_expense', patterns: ['kharcha add karo', 'expense add karo', 'खर्चा जोड़ो'], action: 'add_expense', description: 'Add new expense', module: 'core' },
  { id: 'settings', patterns: ['settings kholo', 'open settings', 'सेटिंग्स खोलो'], action: 'open_settings', description: 'Open settings', module: 'core' },
  { id: 'help', patterns: ['help', 'madad', 'kya kar sakte ho', 'मदद'], action: 'help', description: 'Show help', module: 'core' },

  // ── Idle Money Management ──
  { id: 'idle_check', patterns: ['idle money', 'paisa baithe', 'khaali paisa', 'idle balance', 'bekar paisa'], action: 'check_idle_money', description: 'Check idle money in accounts', module: 'idle_money' },
  { id: 'update_bal', patterns: ['balance update', 'account mein', 'mere account', 'balance hai'], action: 'update_balance', description: 'Update bank balance', module: 'idle_money' },
  { id: 'invest_idle', patterns: ['liquid fund', 'idle invest', 'lagao idle', 'haan lagao'], action: 'invest_idle_money', description: 'Invest idle money', module: 'idle_money' },

  // ── Tax Intelligence ──
  { id: 'tax_harvest', patterns: ['tax harvest', 'bechne ka time', 'LTCG check', 'tax bachao', 'kab bechu'], action: 'check_tax_harvest', description: 'Check tax harvesting opportunities', module: 'tax' },
  { id: 'advance_tax', patterns: ['advance tax', 'tax deadline', 'tax kitna bharna', 'quarterly tax'], action: 'advance_tax_status', description: 'Check advance tax status', module: 'tax' },
  { id: 'check_80c', patterns: ['80C status', 'tax saving', 'kitna bacha', '80C kitna', 'tax deduction'], action: 'check_80c', description: 'Check Section 80C utilization', module: 'tax' },
  { id: 'tax_tips', patterns: ['tax tip', 'tax bachane', 'year end tax', 'tax suggestion'], action: 'tax_saving_tips', description: 'Year-end tax saving tips', module: 'tax' },

  // ── Freelancer OS ──
  { id: 'log_income', patterns: ['payment aaya', 'income log', 'paise aaye', 'bheja', 'received'], action: 'log_income', description: 'Log freelancer income', module: 'freelancer' },
  { id: 'client_summary', patterns: ['client summary', 'client kitna', 'kis client se', 'client payment'], action: 'client_summary', description: 'View client-wise summary', module: 'freelancer' },
  { id: 'gen_invoice', patterns: ['invoice banao', 'bill banao', 'GST invoice', 'invoice generate'], action: 'generate_invoice', description: 'Generate GST invoice', module: 'freelancer' },
  { id: 'itr_export', patterns: ['ITR data', 'ITR export', 'tax return data', 'CA ke liye'], action: 'itr_export', description: 'Export ITR data', module: 'freelancer' },
  { id: 'income_sum', patterns: ['income summary', 'total income', 'kitna kamaya', 'income kitni'], action: 'income_summary', description: 'Income summary', module: 'freelancer' },

  // ── Financial Command Center ──
  { id: 'net_worth', patterns: ['net worth', 'kul daulat', 'total kitna', 'meri daulat', 'sampatti', 'net worth kitni'], action: 'read_net_worth', description: 'Read total net worth', module: 'command_center' },
  { id: 'debt_sum', patterns: ['karza kitna', 'loan summary', 'EMI kitna', 'debt kitna', 'kul karza'], action: 'debt_summary', description: 'Debt summary', module: 'command_center' },
  { id: 'fire_prog', patterns: ['retire kab', 'FIRE progress', 'financial freedom', 'retirement kitna', 'kab retire'], action: 'fire_progress', description: 'FIRE tracker progress', module: 'command_center' },
  { id: 'add_loan_cmd', patterns: ['loan add', 'EMI add', 'naya loan', 'loan jodo'], action: 'add_loan', description: 'Add new loan/EMI', module: 'command_center' },

  // ── Spend Awareness ──
  { id: 'purchase', patterns: ['kharidna hai', 'buy karna', 'purchase', 'lena hai', 'khareedna'], action: 'purchase_check', description: 'Purchase intent check', module: 'spend' },
  { id: 'month_summary', patterns: ['mahine ka hisaab', 'monthly summary', 'month report', 'monthly report', 'pichle mahine'], action: 'monthly_summary', description: 'Monthly spend summary', module: 'spend' },
  { id: 'opp_cost', patterns: ['invest karte toh', 'opportunity cost', 'invest hota toh'], action: 'opportunity_cost', description: 'Show opportunity cost', module: 'spend' },

  // ── Credit Intelligence ──
  { id: 'credit_opt', patterns: ['loan chahiye', 'paise chahiye', 'emergency loan', 'credit option', 'kahan se lu'], action: 'credit_options', description: 'Show credit options', module: 'credit' },
  { id: 'borrow_cap', patterns: ['kitna loan mil', 'borrowing capacity', 'loan eligible', 'kitna le sakta'], action: 'borrowing_capacity', description: 'Borrowing capacity', module: 'credit' },
  { id: 'cheaper_cc', patterns: ['credit card', 'CC se sasta', 'credit card alternative'], action: 'cheaper_than_cc', description: 'Cheaper than CC suggestion', module: 'credit' },
];

// ─── Match Command ──────────────────────────────────────────────
export function matchCommand(text: string): VoiceCommand | null {
  const normalized = text.toLowerCase().trim();
  for (const command of VOICE_COMMANDS) {
    for (const pattern of command.patterns) {
      if (normalized.includes(pattern.toLowerCase())) {
        return command;
      }
    }
  }
  return null;
}

// ─── Extract Entities from Voice ─────────────────────────────────
export function extractEntities(text: string): {
  amount?: number; clientName?: string; bankName?: string; item?: string;
  loanType?: string; months?: number;
} {
  const entities: any = {};

  // Amount extraction
  const amountMatch = text.match(/(?:₹|rs\.?|rupay[ae]?)\s*([\d,]+(?:\.\d+)?)/i) || text.match(/([\d,]+)\s*(?:rupay[ae]?|₹|rs)/i) || text.match(/([\d,]+)\s*(?:lakh|lac)/i);
  if (amountMatch) {
    let amt = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (/lakh|lac/i.test(text)) amt *= 100000;
    if (/crore|cr/i.test(text)) amt *= 10000000;
    entities.amount = amt;
  }

  // Client name extraction (after "se" or "ne" or "ka" or "ke")
  const clientMatch = text.match(/(\w+)\s+(?:ne|se|ka|ke|ki)\s+(?:₹|rs|rupay|payment|bheja|diya|aaya)/i);
  if (clientMatch) entities.clientName = clientMatch[1];

  // Bank name extraction
  const bankMatch = text.match(/(SBI|HDFC|ICICI|Axis|Kotak|PNB|BOB|Canara|Union|IndusInd)/i);
  if (bankMatch) entities.bankName = bankMatch[1];

  // Item description for purchases
  const itemMatch = text.match(/(?:kharidna|buy|lena)\s+(?:hai\s+)?(.+?)(?:\s+ka|\s+ki|\s+ke|$)/i);
  if (itemMatch) entities.item = itemMatch[1].trim();

  // Loan type
  if (/home\s*loan|ghar\s*ka\s*loan/i.test(text)) entities.loanType = 'home';
  else if (/car\s*loan|gaadi/i.test(text)) entities.loanType = 'car';
  else if (/personal\s*loan/i.test(text)) entities.loanType = 'personal';
  else if (/education|padhai/i.test(text)) entities.loanType = 'education';

  // Tenure months
  const monthMatch = text.match(/(\d+)\s*(?:mahine|month|saal|year)/i);
  if (monthMatch) {
    entities.months = parseInt(monthMatch[1]);
    if (/saal|year/i.test(text)) entities.months *= 12;
  }

  return entities;
}

// ─── Command Handlers Interface ──────────────────────────────────
export interface CommandContext {
  lastAIResponse?: string;
  userId?: string;
  language?: string;
  portfolio?: {
    totalFD: number; totalSIP: number; totalCrypto: number;
    totalGold: number; monthlyExpenses: number; savings: number;
  };
}

export interface CommandHandlers {
  navigateTo?: (screen: string) => void;
  goBack?: () => void;
  speak?: (text: string) => void;
  confirm?: () => void;
  cancel?: () => void;
}

// ─── Execute Command (basic nav/core only — feature commands handled in chat) ──
export async function executeCommand(command: VoiceCommand, context: CommandContext, handlers: CommandHandlers): Promise<string> {
  switch (command.action) {
    case 'navigate_dashboard': handlers.navigateTo?.('dashboard'); return 'Dashboard खोल रहा हूँ';
    case 'navigate_chat': handlers.navigateTo?.('chat'); return 'Chat खोल रहा हूँ';
    case 'navigate_portfolio': handlers.navigateTo?.('portfolio'); return 'Portfolio खोल रहा हूँ';
    case 'navigate_expenses': handlers.navigateTo?.('expenses'); return 'खर्चे दिखा रहा हूँ';
    case 'navigate_back': handlers.goBack?.(); return 'वापस जा रहा हूँ';
    case 'repeat_response': if (context.lastAIResponse) { handlers.speak?.(context.lastAIResponse); return context.lastAIResponse; } return 'पिछला जवाब नहीं मिला';
    case 'confirm': handlers.confirm?.(); return 'ठीक है, confirm कर रहा हूँ';
    case 'cancel': handlers.cancel?.(); return 'Cancel कर रहा हूँ';
    case 'open_settings': handlers.navigateTo?.('settings'); return 'Settings खोल रहा हूँ';
    case 'help': return 'Main aapki madad kar sakta hoon — kharcha track, FD/SIP sujhaav, tax bachao, invoice banao, loan compare, net worth dekho. Bas boliye!';
    default: return ''; // Feature commands handled by chat integration
  }
}

// ─── Wake Word Detection ────────────────────────────────────────
const WAKE_WORDS = ['hey vaani', 'हे वाणी', 'ஹே வாணி', 'hey vani'];

export function isWakeWord(text: string): boolean {
  return WAKE_WORDS.some(w => text.toLowerCase().trim().includes(w.toLowerCase()));
}

export function extractCommandAfterWakeWord(text: string): string {
  const normalized = text.toLowerCase().trim();
  for (const w of WAKE_WORDS) {
    if (normalized.includes(w.toLowerCase())) return normalized.split(w.toLowerCase())[1]?.trim() || '';
  }
  return text;
}

export type VoiceListeningState = 'idle' | 'wake_word_listening' | 'command_listening' | 'processing' | 'speaking';

export default { VOICE_COMMANDS, matchCommand, extractEntities, executeCommand, isWakeWord, extractCommandAfterWakeWord };

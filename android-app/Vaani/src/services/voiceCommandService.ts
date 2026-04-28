// ═══════════════════════════════════════════════════════════════════
// VAANI Voice Command Service — Navigation commands via voice
// Wake word: "Hey Vaani" / "हे वाणी" / "ஹே வாணி"
// ═══════════════════════════════════════════════════════════════════

import { VOICE_CONFIG } from '../constants';

// ─── Voice Command Types ────────────────────────────────────────────
export interface VoiceCommand {
  id: string;
  patterns: string[];
  action: VoiceAction;
  description: string;
}

export type VoiceAction =
  | 'navigate_dashboard'
  | 'navigate_chat'
  | 'navigate_portfolio'
  | 'navigate_expenses'
  | 'navigate_back'
  | 'repeat_response'
  | 'confirm'
  | 'cancel'
  | 'read_fd_rates'
  | 'read_crypto_prices'
  | 'read_expenses'
  | 'read_sip_value'
  | 'read_balance'
  | 'add_expense'
  | 'open_settings'
  | 'help';

// ─── Voice Command Definitions ───────────────────────────────────────
export const VOICE_COMMANDS: VoiceCommand[] = [
  { id: 'nav_dashboard', patterns: ['dashboard dikhao', 'show dashboard', 'डैशबोर्ड दिखाओ'], action: 'navigate_dashboard', description: 'Navigate to dashboard' },
  { id: 'nav_chat', patterns: ['chat kholao', 'open chat', 'चैट खोलो'], action: 'navigate_chat', description: 'Open chat screen' },
  { id: 'nav_portfolio', patterns: ['portfolio dikhao', 'show portfolio', 'निवेश दिखाओ'], action: 'navigate_portfolio', description: 'View investment portfolio' },
  { id: 'nav_expenses', patterns: ['kharcha dikhao', 'show expenses', 'खर्चा दिखाओ'], action: 'navigate_expenses', description: 'View expenses' },
  { id: 'nav_back', patterns: ['wapas jao', 'go back', 'वापस जाओ'], action: 'navigate_back', description: 'Go back' },
  { id: 'repeat', patterns: ['phir se batao', 'repeat that', 'फिर से बताओ'], action: 'repeat_response', description: 'Repeat last response' },
  { id: 'confirm_yes', patterns: ['haan', 'yes', 'confirm', 'जी हाँ'], action: 'confirm', description: 'Confirm action' },
  { id: 'confirm_no', patterns: ['nahi', 'no', 'cancel', 'नहीं'], action: 'cancel', description: 'Cancel action' },
  { id: 'fd_rates', patterns: ['FD rates batao', 'fixed deposit rates', 'गल्ला बंद दरें'], action: 'read_fd_rates', description: 'Read FD rates' },
  { id: 'crypto_prices', patterns: ['crypto price batao', 'bitcoin bhav', 'क्रिप्टो भाव'], action: 'read_crypto_prices', description: 'Read crypto prices' },
  { id: 'expenses', patterns: ['kitna kharcha hua', 'total expenses', 'खर्चा कितना हुआ'], action: 'read_expenses', description: 'Read total expenses' },
  { id: 'sip_value', patterns: ['SIP kitna hai', 'SIP value', 'सिप कितना है'], action: 'read_sip_value', description: 'Read SIP portfolio value' },
  { id: 'balance', patterns: ['baki balance', 'balance batao', 'शेष राशि'], action: 'read_balance', description: 'Read savings balance' },
  { id: 'add_expense', patterns: ['kharcha add karo', 'expense add karo', 'खर्चा जोड़ो'], action: 'add_expense', description: 'Add new expense' },
  { id: 'settings', patterns: ['settings kholo', 'open settings', 'सेटिंग्स खोलो'], action: 'open_settings', description: 'Open settings' },
];

// ─── Match Command ──────────────────────────────────────────────────
export function matchCommand(text: string): VoiceCommand | null {
  const normalizedText = text.toLowerCase().trim();
  for (const command of VOICE_COMMANDS) {
    for (const pattern of command.patterns) {
      if (normalizedText.includes(pattern.toLowerCase())) {
        return command;
      }
    }
  }
  return null;
}

// ─── Command Context ────────────────────────────────────────────────
export interface CommandContext {
  lastAIResponse?: string;
  portfolio?: {
    totalFD: number;
    totalSIP: number;
    totalCrypto: number;
    totalGold: number;
    monthlyExpenses: number;
    savings: number;
  };
}

// ─── Command Handlers Interface ──────────────────────────────────────
export interface CommandHandlers {
  navigateTo?: (screen: string) => void;
  goBack?: () => void;
  speak?: (text: string) => void;
  confirm?: () => void;
  cancel?: () => void;
}

// ─── Execute Command ────────────────────────────────────────────────
export async function executeCommand(
  command: VoiceCommand,
  context: CommandContext,
  handlers: CommandHandlers
): Promise<string> {
  switch (command.action) {
    case 'navigate_dashboard':
      handlers.navigateTo?.('dashboard');
      return 'Dashboard खोल रहा हूँ';
    case 'navigate_chat':
      handlers.navigateTo?.('chat');
      return 'Chat खोल रहा हूँ';
    case 'navigate_portfolio':
      handlers.navigateTo?.('portfolio');
      return 'Portfolio खोल रहा हूँ';
    case 'navigate_expenses':
      handlers.navigateTo?.('expenses');
      return 'खर्चे दिखा रहा हूँ';
    case 'navigate_back':
      handlers.goBack?.();
      return 'वापस जा रहा हूँ';
    case 'repeat_response':
      if (context.lastAIResponse) {
        handlers.speak?.(context.lastAIResponse);
        return context.lastAIResponse;
      }
      return 'पिछला जवाब नहीं मिला';
    case 'confirm':
      handlers.confirm?.();
      return 'ठीक है, confirm कर रहा हूँ';
    case 'cancel':
      handlers.cancel?.();
      return 'Cancel कर रहा हूँ';
    case 'read_fd_rates':
      handlers.speak?.('FD rates: SBI 5.10%, HDFC 5.10%, ICICI 5.15%');
      return 'FD rates: SBI 5.10%, HDFC 5.10%, ICICI 5.15%';
    case 'read_crypto_prices':
      handlers.speak?.(`Crypto portfolio: ₹${context.portfolio?.totalCrypto || 0}`);
      return `Crypto portfolio: ₹${context.portfolio?.totalCrypto || 0}`;
    case 'read_expenses':
      handlers.speak?.(`इस महीने खर्चा: ₹${context.portfolio?.monthlyExpenses || 0}`);
      return `इस महीने खर्चा: ₹${context.portfolio?.monthlyExpenses || 0}`;
    case 'read_sip_value':
      handlers.speak?.(`SIP portfolio: ₹${context.portfolio?.totalSIP || 0}`);
      return `SIP portfolio: ₹${context.portfolio?.totalSIP || 0}`;
    case 'read_balance':
      handlers.speak?.(`बचत: ₹${context.portfolio?.savings || 0}`);
      return `बचत: ₹${context.portfolio?.savings || 0}`;
    case 'add_expense':
      handlers.navigateTo?.('addExpense');
      return 'खर्चा add करने के लिए बोलिए';
    case 'open_settings':
      handlers.navigateTo?.('settings');
      return 'Settings खोल रहा हूँ';
    default:
      return 'Command समझ नहीं आया';
  }
}

// ─── Wake Word Detection ────────────────────────────────────────────
const WAKE_WORDS = ['hey vaani', 'हे वाणी', 'ஹே வாணி', 'hey vani'];

export function isWakeWord(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return WAKE_WORDS.some(wakeWord => normalized.includes(wakeWord.toLowerCase()));
}

export function extractCommandAfterWakeWord(text: string): string {
  const normalized = text.toLowerCase().trim();
  for (const wakeWord of WAKE_WORDS) {
    if (normalized.includes(wakeWord.toLowerCase())) {
      return normalized.split(wakeWord.toLowerCase())[1]?.trim() || '';
    }
  }
  return text;
}

// ─── Voice Listening State ──────────────────────────────────────────
export type VoiceListeningState = 'idle' | 'wake_word_listening' | 'command_listening' | 'processing' | 'speaking';

export default { VOICE_COMMANDS, matchCommand, executeCommand, isWakeWord, extractCommandAfterWakeWord };

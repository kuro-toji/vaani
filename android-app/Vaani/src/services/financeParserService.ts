// ═══════════════════════════════════════════════════════════════════
// VAANI Finance Voice Parser — Natural speech to structured actions
// ═══════════════════════════════════════════════════════════════════

import { API_CONFIG } from '../constants';

export type FinanceIntent = 'log_expense' | 'set_budget' | 'create_savings_goal' | 'fetch_crypto_price' | 'fetch_sip_value' | 'fetch_fd_rates' | 'ask_question' | 'unknown';

export interface ParsedIntent {
  intent: FinanceIntent;
  entities: { amount?: number; category?: string; description?: string; date?: string; coin?: string; fund?: string; goalName?: string; targetAmount?: number; deadline?: string; };
  confidence: number;
  originalText: string;
}

const SYSTEM_PROMPT = `You are VAANI Finance Parser. Parse user speech into structured JSON. Output ONLY valid JSON. Intents: log_expense, set_budget, create_savings_goal, fetch_crypto_price, fetch_sip_value, fetch_fd_rates, ask_question. Categories: food, transport, utilities, entertainment, health, education, shopping, investment, rent, other.`;

export async function parseFinanceIntent(text: string, language: string = 'hi'): Promise<ParsedIntent> {
  const regexResult = parseWithRegex(text);
  if (regexResult.confidence > 0.9) return { ...regexResult, originalText: text };

  try {
    const response = await fetch(API_CONFIG.MINIMAX_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_CONFIG.MINIMAX_API_KEY}` },
      body: JSON.stringify({ model: 'abab6.5s-chat', temperature: 0.1, max_tokens: 256, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: text }] }),
    });
    if (!response.ok) return { intent: 'unknown', entities: {}, confidence: 0, originalText: text };
    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();
    if (!aiResponse) return { intent: 'unknown', entities: {}, confidence: 0, originalText: text };
    try {
      const parsed = JSON.parse(aiResponse);
      return { intent: parsed.intent || 'unknown', entities: parsed.entities || {}, confidence: parsed.confidence || 0.5, originalText: text };
    } catch { return { intent: 'unknown', entities: {}, confidence: 0, originalText: text }; }
  } catch { return { intent: 'unknown', entities: {}, confidence: 0, originalText: text }; }
}

function parseWithRegex(text: string): ParsedIntent {
  const normalized = text.toLowerCase().trim();

  // Expense patterns
  const expenseMatch = normalized.match(/(?:₹|rs\.?|rupees?)?\s*([\d,]+)\s*(?:ka?|ke?|ki?)?\s*(\w+)?/i) || normalized.match(/(\w+)\s*(?:₹)?\s*([\d,]+)/i);
  if (expenseMatch) {
    const amount = parseAmount(expenseMatch[1] || expenseMatch[2]);
    const category = extractCategory(expenseMatch[2] || expenseMatch[1] || '');
    if (amount > 0) return { intent: 'log_expense', entities: { amount, category, description: expenseMatch[2] || '' }, confidence: 0.95, originalText: text };
  }

  // Budget patterns
  const budgetMatch = normalized.match(/(?:budget|limit|बजट)\s*(?:rakh|set)?\s*([\d,]+)/i);
  if (budgetMatch) {
    const amount = parseAmount(budgetMatch[1]);
    if (amount > 0) return { intent: 'set_budget', entities: { amount, category: 'other' }, confidence: 0.9, originalText: text };
  }

  // Savings goal patterns
  const savingsMatch = normalized.match(/(\d+)\s*(?:lakh|lac)?\s*(.+?)(?:\s+ke\s+liye|\s+liye|$)/i);
  if (savingsMatch) {
    const targetAmount = parseAmount(savingsMatch[1]) * 100000;
    const goalName = savingsMatch[2]?.trim() || 'Goal';
    if (targetAmount > 0) return { intent: 'create_savings_goal', entities: { targetAmount, goalName }, confidence: 0.85, originalText: text };
  }

  // Crypto patterns
  if (/bitcoin|btc|ethereum|eth/i.test(normalized)) {
    const coin = /bitcoin|btc/i.test(normalized) ? 'BTC' : 'ETH';
    return { intent: 'fetch_crypto_price', entities: { coin }, confidence: 0.9, originalText: text };
  }

  // SIP patterns
  if (/sip|mutual fund/i.test(normalized)) return { intent: 'fetch_sip_value', entities: {}, confidence: 0.85, originalText: text };

  // FD patterns
  if (/fd|fixed deposit|गल्ला\s*बंद/i.test(normalized)) return { intent: 'fetch_fd_rates', entities: {}, confidence: 0.9, originalText: text };

  return { intent: 'unknown', entities: {}, confidence: 0, originalText: text };
}

function parseAmount(text: string): number {
  if (!text) return 0;
  const cleaned = text.replace(/[,\s]/g, '');
  let multiplier = 1;
  if (/lakh|lac/i.test(cleaned)) multiplier = 100000;
  else if (/crore|cr/i.test(cleaned)) multiplier = 10000000;
  const match = cleaned.match(/[\d.]+/);
  return match ? parseFloat(match[0]) * multiplier : 0;
}

function extractCategory(text: string): string {
  if (!text) return 'other';
  const normalized = text.toLowerCase();
  const map: Record<string, string> = {
    'chai': 'food', 'khana': 'food', 'food': 'food', 'transport': 'transport', 'bus': 'transport', 'auto': 'transport',
    'bill': 'utilities', 'light': 'utilities', 'electricity': 'utilities', 'rent': 'rent', 'ghar': 'rent',
    'shopping': 'shopping', 'kapde': 'shopping', 'clothes': 'shopping', 'education': 'education', 'padhai': 'education',
    'health': 'health', 'dawai': 'health', 'medicine': 'health', 'entertainment': 'entertainment', 'movie': 'entertainment',
    'investment': 'investment', 'nivesh': 'investment', 'sip': 'investment',
  };
  for (const [key, category] of Object.entries(map)) {
    if (normalized.includes(key)) return category;
  }
  return 'other';
}

export interface ActionResult { success: boolean; message: string; data?: any; }

export async function executeFinanceIntent(intent: ParsedIntent, services: {
  addExpense?: (amount: number, category: string, description: string) => Promise<void>;
  setBudget?: (amount: number, category: string) => Promise<void>;
  createSavingsGoal?: (name: string, target: number, deadline?: string) => Promise<void>;
  fetchCryptoPrice?: (coin: string) => Promise<any>;
  fetchSIPValue?: (fund?: string) => Promise<any>;
  fetchFDRates?: () => Promise<any>;
}): Promise<ActionResult> {
  if (intent.confidence < 0.5) return { success: false, message: 'Could not understand' };

  try {
    switch (intent.intent) {
      case 'log_expense':
        if (services.addExpense && intent.entities.amount) {
          await services.addExpense(intent.entities.amount, intent.entities.category || 'other', intent.entities.description || '');
          return { success: true, message: `₹${intent.entities.amount} logged` };
        }
        break;
      case 'set_budget':
        if (services.setBudget && intent.entities.amount) {
          await services.setBudget(intent.entities.amount, intent.entities.category || 'other');
          return { success: true, message: `Budget ₹${intent.entities.amount} set` };
        }
        break;
      case 'create_savings_goal':
        if (services.createSavingsGoal && intent.entities.targetAmount) {
          await services.createSavingsGoal(intent.entities.goalName || 'Goal', intent.entities.targetAmount, intent.entities.deadline);
          return { success: true, message: `Goal "${intent.entities.goalName}" created` };
        }
        break;
      case 'fetch_crypto_price':
        if (services.fetchCryptoPrice) return { success: true, message: `${intent.entities.coin} price fetched`, data: await services.fetchCryptoPrice(intent.entities.coin || 'BTC') };
        break;
      case 'fetch_sip_value':
        if (services.fetchSIPValue) return { success: true, message: 'SIP value fetched', data: await services.fetchSIPValue(intent.entities.fund) };
        break;
      case 'fetch_fd_rates':
        if (services.fetchFDRates) return { success: true, message: 'FD rates fetched', data: await services.fetchFDRates() };
        break;
    }
  } catch (error) { return { success: false, message: 'Failed to execute' }; }
  return { success: false, message: 'Action not supported' };
}

export default { parseFinanceIntent, executeFinanceIntent };

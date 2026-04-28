// ═══════════════════════════════════════════════════════════════════
// VAANI Finance Voice Parser — Natural speech to structured actions
// Uses MiniMax with temperature 0.1 for strict JSON-only output
// ═══════════════════════════════════════════════════════════════════

import { API_CONFIG } from '../constants';

// ─── Finance Intent Types ─────────────────────────────────────────────
export type FinanceIntent =
  | 'log_expense'
  | 'set_budget'
  | 'create_savings_goal'
  | 'fetch_crypto_price'
  | 'fetch_sip_value'
  | 'fetch_fd_rates'
  | 'ask_question'
  | 'unknown';

export interface ParsedIntent {
  intent: FinanceIntent;
  entities: {
    amount?: number;
    category?: string;
    description?: string;
    date?: string;
    coin?: string;
    fund?: string;
    goalName?: string;
    targetAmount?: number;
    deadline?: string;
  };
  confidence: number;
  originalText: string;
}

// ─── Intent Classification System Prompt ─────────────────────────────
const SYSTEM_PROMPT = `You are VAANI Finance Parser. Parse user speech into structured JSON.

Rules:
- Output ONLY valid JSON, no other text
- temperature: 0.1 for strict output
- Map Indian language to structured data

Intents:
1. log_expense: "500 rupees chai pe kharcha", "₹50 chai"
   → { amount, category, description }

2. set_budget: "5000 khane pe limit rakh", "₹3000 food budget"
   → { amount, category }

3. create_savings_goal: "beti ki shaadi ke liye 2 lakh bachana hai"
   → { goalName, targetAmount, deadline? }

4. fetch_crypto_price: "bitcoin bhav kya hai", "ethereum kitna hai"
   → { coin }

5. fetch_sip_value: "mera SIP kitna ho gaya", "mutual fund value"
   → { fund? }

6. fetch_fd_rates: "konsa FD sabse accha hai", "FD rates batao"
   → { intent: "fetch_fd_rates" }

7. ask_question: anything else
   → { intent: "ask_question", description }

Categories: food, transport, utilities, entertainment, health, education, shopping, investment, rent, other

Respond ONLY with JSON in this format:
{"intent": "log_expense", "entities": {"amount": 500, "category": "food", "description": "chai"}}

If unknown: {"intent": "unknown", "entities": {}, "confidence": 0}`;

// ─── Parse Finance Intent ─────────────────────────────────────────────
export async function parseFinanceIntent(
  text: string,
  language: string = 'hi'
): Promise<ParsedIntent> {
  // First, try regex-based parsing for common patterns
  const regexResult = parseWithRegex(text);
  if (regexResult.confidence > 0.9) {
    return { ...regexResult, originalText: text };
  }

  // Fall back to AI parsing
  try {
    const response = await fetch(API_CONFIG.MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        temperature: 0.1,
        max_tokens: 256,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      }),
    });

    if (!response.ok) {
      console.error('[FinanceParser] API error:', response.status);
      return { intent: 'unknown', entities: {}, confidence: 0, originalText: text };
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      return { intent: 'unknown', entities: {}, confidence: 0, originalText: text };
    }

    // Parse AI response as JSON
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        intent: parsed.intent || 'unknown',
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.5,
        originalText: text,
      };
    } catch {
      console.error('[FinanceParser] Failed to parse AI response:', aiResponse);
      return { intent: 'unknown', entities: {}, confidence: 0, originalText: text };
    }
  } catch (error) {
    console.error('[FinanceParser] Error:', error);
    return { intent: 'unknown', entities: {}, confidence: 0, originalText: text };
  }
}

// ─── Regex-based Parser (Fast Path) ──────────────────────────────────
function parseWithRegex(text: string): ParsedIntent {
  const normalized = text.toLowerCase().trim();

  // Expense patterns
  const expensePatterns = [
    // "₹500 chai pe", "500 rupees chai", "500 ka chai"
    /([\d,]+)\s*(?:rupees?|₹|rs\.?)?\s*(?:ka?|ke?|ki?)?\s*(\w+)\s*(?:pe|par|पर)?/i,
    // "₹500 chai", "chai ₹500"
    /(\w+)\s*(?:₹|₹)?([\d,]+)/i,
    // "spent 500 on chai", "kharcha 500 chai"
    /(?:spent|kharcha|खर्चा)\s*([\d,]+)\s*(?:on|par|pe|पर)?\s*(\w+)?/i,
  ];

  for (const pattern of expensePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const amount = parseAmount(match[1] || match[2]);
      const category = extractCategory(match[2] || match[1] || '');
      const description = match[2] || match[1] || '';
      
      if (amount > 0) {
        return {
          intent: 'log_expense',
          entities: { amount, category, description },
          confidence: 0.95,
          originalText: text,
        };
      }
    }
  }

  // Budget patterns
  const budgetPatterns = [
    // "5000 khane pe limit", "₹3000 food budget"
    /([\d,]+)\s*(?:ka?|ke?|ki?)?\s*(\w+)\s*(?:limit|budget|बजट)/i,
    // "limit rakh 5000", "budget 5000"
    /(?:limit|budget|बजट)\s*(?:rakh|set)?\s*([\d,]+)/i,
  ];

  for (const pattern of budgetPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      const category = extractCategory(match[2] || '');
      
      if (amount > 0) {
        return {
          intent: 'set_budget',
          entities: { amount, category },
          confidence: 0.9,
          originalText: text,
        };
      }
    }
  }

  // Savings goal patterns
  const savingsPatterns = [
    // "2 lakh bachana hai", "₹200000 beti ki shaadi ke liye"
    /([\d,]+)\s*(?:lakh|lac|lc|l)?\s*(\w+\s*\w*)\s*(?:ke liye|ke|के लिए|liye)?/i,
    // "bachana hai 2 lakh", "save 200000"
    /(?:bachana|save|banaana)\s*(?:hai)?\s*([\d,]+)\s*(?:lakh|lac)?\s*(\w+\s*\w*)?/i,
  ];

  for (const pattern of savingsPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const targetAmount = parseAmount(match[1]) * 100000; // lakh to number
      const goalName = match[2] || 'Goal';
      
      if (targetAmount > 0) {
        return {
          intent: 'create_savings_goal',
          entities: { targetAmount, goalName },
          confidence: 0.85,
          originalText: text,
        };
      }
    }
  }

  // Crypto price patterns
  const cryptoPatterns = [
    // "bitcoin bhav", "bitcoin price", "BTC kya hai"
    /(?:bitcoin|btc|₿)\s*(?:bhav|price|kitna)?/i,
    /(?:ethereum|eth)\s*(?:bhav|price|kitna)?/i,
    /(?:crypto|क्रिप्टो)\s*(\w+)?\s*(?:bhav|price)?/i,
  ];

  for (const pattern of cryptoPatterns) {
    if (pattern.test(normalized)) {
      const coin = normalized.includes('bitcoin') || normalized.includes('btc') ? 'BTC'
        : normalized.includes('ethereum') || normalized.includes('eth') ? 'ETH'
        : 'CRYPTO';
      
      return {
        intent: 'fetch_crypto_price',
        entities: { coin },
        confidence: 0.9,
        originalText: text,
      };
    }
  }

  // SIP value patterns
  const sipPatterns = [
    /sip\s*(?:kitna|value|ho gaya)?/i,
    /mutual fund\s*(?:value|kitna)?/i,
    /(?:पोर्टफोलियो|portfolio)\s*(?:value|kitna)?/i,
  ];

  for (const pattern of sipPatterns) {
    if (pattern.test(normalized)) {
      return {
        intent: 'fetch_sip_value',
        entities: {},
        confidence: 0.85,
        originalText: text,
      };
    }
  }

  // FD rates patterns
  const fdPatterns = [
    /fd\s*(?:rates?|bhav|dikhao)?/i,
    /गल्ला\s*(?:बंद|band)/i,
    /fixed deposit/i,
  ];

  for (const pattern of fdPatterns) {
    if (pattern.test(normalized)) {
      return {
        intent: 'fetch_fd_rates',
        entities: {},
        confidence: 0.9,
        originalText: text,
      };
    }
  }

  return { intent: 'unknown', entities: {}, confidence: 0, originalText: text };
}

// ─── Helper: Parse Amount ──────────────────────────────────────────────
function parseAmount(text: string): number {
  if (!text) return 0;
  
  // Remove commas and spaces
  const cleaned = text.replace(/[,\s]/g, '');
  
  // Handle lakh/crore
  let multiplier = 1;
  if (cleaned.match(/lakh|lac/i)) {
    multiplier = 100000;
  } else if (cleaned.match(/crore|cr/i)) {
    multiplier = 10000000;
  }
  
  // Extract number
  const numberMatch = cleaned.match(/[\d.]+/);
  if (numberMatch) {
    return parseFloat(numberMatch[0]) * multiplier;
  }
  
  return 0;
}

// ─── Helper: Extract Category ─────────────────────────────────────────
function parseAmount(text: string): number {
  if (!text) return 0;
  
  // Remove commas and spaces
  const cleaned = text.replace(/[,\s]/g, '');
  
  // Handle lakh/crore
  let multiplier = 1;
  if (cleaned.match(/lakh|lac/i)) {
    multiplier = 100000;
  } else if (cleaned.match(/crore|cr/i)) {
    multiplier = 10000000;
  }
  
  // Extract number
  const numberMatch = cleaned.match(/[\d.]+/);
  if (numberMatch) {
    return parseFloat(numberMatch[0]) * multiplier;
  }
  
  return 0;
}

// ─── Helper: Extract Category ─────────────────────────────────────────
function extractCategory(text: string): string {
  if (!text) return 'other';
  
  const normalized = text.toLowerCase();
  
  const categoryMap: Record<string, string> = {
    'chai': 'food',
    'khana': 'food',
    'food': 'food',
    'kharcha': 'other',
    'transport': 'transport',
    'bus': 'transport',
    'auto': 'transport',
    'petrol': 'transport',
    'bill': 'utilities',
    'light': 'utilities',
    ' electricity': 'utilities',
    'rent': 'rent',
    'ghar': 'rent',
    'shopping': 'shopping',
    'kapde': 'shopping',
    'clothes': 'shopping',
    'education': 'education',
    'padhai': 'education',
    'kitab': 'education',
    'health': 'health',
    'dawai': 'health',
    'medicine': 'health',
    'entertainment': 'entertainment',
    'movie': 'entertainment',
    ' OTT': 'entertainment',
    'investment': 'investment',
    'nivesh': 'investment',
    'sip': 'investment',
  };
  
  for (const [key, category] of Object.entries(categoryMap)) {
    if (normalized.includes(key)) {
      return category;
    }
  }
  
  return 'other';
}

// ─── Execute Intent Action ────────────────────────────────────────────
export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

export async function executeFinanceIntent(
  intent: ParsedIntent,
  services: {
    addExpense?: (amount: number, category: string, description: string) => Promise<void>;
    setBudget?: (amount: number, category: string) => Promise<void>;
    createSavingsGoal?: (name: string, target: number, deadline?: string) => Promise<void>;
    fetchCryptoPrice?: (coin: string) => Promise<any>;
    fetchSIPValue?: (fund?: string) => Promise<any>;
    fetchFDRates?: () => Promise<any>;
  }
): Promise<ActionResult> {
  if (intent.confidence < 0.5) {
    return { success: false, message: 'Could not understand the request' };
  }

  try {
    switch (intent.intent) {
      case 'log_expense':
        if (services.addExpense && intent.entities.amount) {
          await services.addExpense(
            intent.entities.amount,
            intent.entities.category || 'other',
            intent.entities.description || ''
          );
          return {
            success: true,
            message: `₹${intent.entities.amount} ${intent.entities.category || 'expense'} logged`,
          };
        }
        break;

      case 'set_budget':
        if (services.setBudget && intent.entities.amount) {
          await services.setBudget(
            intent.entities.amount,
            intent.entities.category || 'other'
          );
          return {
            success: true,
            message: `Budget ₹${intent.entities.amount} set for ${intent.entities.category || 'category'}`,
          };
        }
        break;

      case 'create_savings_goal':
        if (services.createSavingsGoal && intent.entities.targetAmount) {
          await services.createSavingsGoal(
            intent.entities.goalName || 'Goal',
            intent.entities.targetAmount,
            intent.entities.deadline
          );
          return {
            success: true,
            message: `Savings goal "${intent.entities.goalName}" of ₹${intent.entities.targetAmount} created`,
          };
        }
        break;

      case 'fetch_crypto_price':
        if (services.fetchCryptoPrice) {
          const price = await services.fetchCryptoPrice(intent.entities.coin || 'BTC');
          return {
            success: true,
            message: `${intent.entities.coin || 'BTC'} price: ₹${price}`,
            data: price,
          };
        }
        break;

      case 'fetch_sip_value':
        if (services.fetchSIPValue) {
          const value = await services.fetchSIPValue(intent.entities.fund);
          return {
            success: true,
            message: `SIP value: ₹${value}`,
            data: value,
          };
        }
        break;

      case 'fetch_fd_rates':
        if (services.fetchFDRates) {
          const rates = await services.fetchFDRates();
          return {
            success: true,
            message: 'FD rates fetched',
            data: rates,
          };
        }
        break;
    }
  } catch (error) {
    console.error('[FinanceParser] Execute error:', error);
    return { success: false, message: 'Failed to execute action' };
  }

  return { success: false, message: 'Action not supported' };
}

export default { parseFinanceIntent, executeFinanceIntent };

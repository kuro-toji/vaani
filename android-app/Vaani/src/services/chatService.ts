// ═══════════════════════════════════════════════════════════════════
// VAANI Chat Service — MiniMax M2.7 Streaming AI
// ═══════════════════════════════════════════════════════════════════

import { API_CONFIG, APP_CONFIG, DIALECT_METAPHORS, GOVERNMENT_SCHEMES } from '../constants';
import type { ChatMessage, ActionCard } from '../types';

// ─── System Prompt ──────────────────────────────────────────────
function getSystemPrompt(language: string, userName?: string, region?: string): string {
  const dialectMap = DIALECT_METAPHORS[language] || DIALECT_METAPHORS.hi;
  const name = userName ? `, ${userName}` : '';
  const regionInfo = region ? `User's region: ${region}.` : '';

  return `You are VAANI (वाणी), India's most trusted voice-first financial advisor. You speak in ${language === 'en' ? 'simple English' : 'the user\'s language (' + language + ')'}.

PERSONALITY:
- You are warm, patient, and caring — like a knowledgeable village elder who knows every financial product in India
- You use simple village-level analogies for complex financial concepts
- You NEVER use English unless the user speaks English
- You are encouraging about saving and investing
- When user shows financial anxiety, switch to calming, simple explanations

DIALECT METAPHORS (use these terms):
${Object.entries(dialectMap).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

CAPABILITIES:
1. EXPENSE TRACKING: When user says something like "50 rupaye chai pe kharch kiye", extract: amount, category, description. Respond with confirmation and log it.
   Format expense as: [EXPENSE:amount:category:description]
2. BUDGET ALERTS: If user's spending in a category exceeds 80%, warn them naturally in conversation
3. FD/SIP ADVICE: Compare rates, suggest laddering, explain TDS
4. GOVERNMENT SCHEMES: Suggest relevant schemes based on user's profile. Available: ${GOVERNMENT_SCHEMES.map(s => s.name).join(', ')}
5. FINANCIAL HEALTH: Provide actionable advice based on their portfolio

${regionInfo}

RULES:
- Keep responses under 150 words
- NEVER ask for Aadhaar, PAN, or full bank details
- Provide factual information, not investment advice
- Always be respectful and use honorifics (aap, ji)
- If unsure, say "Main is baare mein aur jaankari le kar aata hoon"

RESPONSE FORMAT:
- For expenses: Include [EXPENSE:500:food:chai] tag
- For budget alerts: Include [BUDGET_ALERT:category:percentage] tag
- Keep it conversational and warm${name ? `\nUser's name: ${name}` : ''}`;
}

// ─── Send Chat Message (Streaming) ──────────────────────────────
export async function sendChatMessage(
  messages: ChatMessage[],
  userMessage: string,
  language: string,
  options?: {
    userName?: string;
    region?: string;
    onToken?: (token: string) => void;
    onActionCard?: (card: ActionCard) => void;
    onDone?: (fullResponse: string) => void;
    onError?: (error: string) => void;
  }
): Promise<string> {
  const apiKey = API_CONFIG.MINIMAX_API_KEY;

  if (!apiKey) {
    // Demo mode — simulate AI response
    return simulateResponse(userMessage, language, options);
  }

  try {
    const systemPrompt = getSystemPrompt(language, options?.userName, options?.region);

    // Build message history (last N messages)
    const history = messages.slice(-APP_CONFIG.max_chat_history).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const body = {
      model: 'MiniMax-Text-01',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    };

    const response = await fetch(API_CONFIG.MINIMAX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Chat] MiniMax error:', response.status, errorText);
      options?.onError?.(`AI service error: ${response.status}`);
      return simulateResponse(userMessage, language, options);
    }

    // Stream response
    let fullResponse = '';
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              fullResponse += token;
              options?.onToken?.(token);
            }
          } catch {}
        }
      }
    }

    // Parse action cards from response
    const actionCards = parseActionCards(fullResponse);
    if (actionCards.length > 0) {
      for (const card of actionCards) {
        options?.onActionCard?.(card);
      }
    }

    // Clean response (remove action tags)
    const cleanResponse = cleanActionTags(fullResponse);
    options?.onDone?.(cleanResponse);
    return cleanResponse;
  } catch (error: any) {
    console.error('[Chat] Error:', error);
    options?.onError?.(error.message);
    return simulateResponse(userMessage, language, options);
  }
}

// ─── Parse Action Cards from Response ───────────────────────────
function parseActionCards(text: string): ActionCard[] {
  const cards: ActionCard[] = [];

  // Parse expense tags: [EXPENSE:500:food:chai]
  const expenseRegex = /\[EXPENSE:(\d+):(\w+):([^\]]+)\]/g;
  let match;
  while ((match = expenseRegex.exec(text)) !== null) {
    cards.push({
      type: 'expense_logged',
      title: 'खर्चा दर्ज',
      data: {
        amount: parseInt(match[1]),
        category: match[2],
        description: match[3],
      },
    });
  }

  // Parse budget alerts: [BUDGET_ALERT:food:85]
  const budgetRegex = /\[BUDGET_ALERT:(\w+):(\d+)\]/g;
  while ((match = budgetRegex.exec(text)) !== null) {
    cards.push({
      type: 'budget_alert',
      title: 'बजट अलर्ट',
      data: {
        category: match[1],
        percentage: parseInt(match[2]),
      },
    });
  }

  return cards;
}

// ─── Clean Action Tags from Response ────────────────────────────
function cleanActionTags(text: string): string {
  return text
    .replace(/\[EXPENSE:[^\]]+\]/g, '')
    .replace(/\[BUDGET_ALERT:[^\]]+\]/g, '')
    .trim();
}

// ─── Parse Expense from User Message ────────────────────────────
export function parseExpenseIntent(text: string): {
  isExpense: boolean;
  amount?: number;
  category?: string;
  description?: string;
} {
  // Hindi expense patterns
  const patterns = [
    /(\d+)\s*(?:rupay[ae]?|₹|rs\.?)\s+(.+?)(?:\s+(?:pe|par|mein|ka|ki|ke)\s+)?(?:kharch(?:a|e)?|spent|lagay[ae]?|diy[ae]?)/i,
    /(?:kharch(?:a|e)?|spent|lagay[ae]?)\s+(\d+)\s*(?:rupay[ae]?|₹|rs\.?)?\s*(.+)/i,
    /(\d+)\s*(?:rupay[ae]?|₹|rs\.?)\s+(.+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseInt(match[1]);
      const desc = match[2]?.trim() || '';
      return {
        isExpense: true,
        amount,
        category: categorizeExpense(desc),
        description: desc,
      };
    }
  }

  return { isExpense: false };
}

// ─── Auto-categorize Expense ────────────────────────────────────
function categorizeExpense(description: string): string {
  const lower = description.toLowerCase();
  const categoryKeywords: Record<string, string[]> = {
    food: ['chai', 'khana', 'nashta', 'lunch', 'dinner', 'grocery', 'doodh', 'sabzi', 'fruit', 'restaurant', 'hotel', 'biryani', 'roti', 'dal', 'चाय', 'खाना', 'दूध', 'सब्ज़ी'],
    transport: ['petrol', 'diesel', 'auto', 'uber', 'ola', 'bus', 'train', 'ticket', 'taxi', 'metro', 'पेट्रोल', 'ऑटो', 'बस'],
    utilities: ['bijli', 'pani', 'gas', 'phone', 'recharge', 'wifi', 'electricity', 'water', 'बिजली', 'पानी', 'गैस'],
    health: ['dawai', 'doctor', 'hospital', 'medicine', 'medical', 'दवाई', 'डॉक्टर'],
    education: ['school', 'college', 'book', 'tuition', 'class', 'fees', 'किताब', 'स्कूल'],
    entertainment: ['movie', 'film', 'game', 'cinema', 'netflix', 'फ़िल्म'],
    shopping: ['kapda', 'shoes', 'clothes', 'amazon', 'flipkart', 'कपड़ा'],
    rent: ['kiraya', 'rent', 'किराया'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(k => lower.includes(k))) return category;
  }
  return 'other';
}

// ─── Simulate Response (Demo/Offline Mode) ──────────────────────
async function simulateResponse(
  userMessage: string,
  language: string,
  options?: {
    onToken?: (token: string) => void;
    onDone?: (fullResponse: string) => void;
    onActionCard?: (card: ActionCard) => void;
  }
): Promise<string> {
  // Check for expense intent
  const expense = parseExpenseIntent(userMessage);

  let response: string;
  if (expense.isExpense && expense.amount) {
    response = language === 'en'
      ? `Done! ₹${expense.amount} expense logged for ${expense.description}. Your ${expense.category} spending this month is well within budget. Keep tracking!`
      : `हो गया! ₹${expense.amount} का खर्चा "${expense.description}" में दर्ज कर दिया। आपका ${expense.category || 'अन्य'} खर्चा बजट में है। ऐसे ही ट्रैक करते रहिए!`;

    options?.onActionCard?.({
      type: 'expense_logged',
      title: 'खर्चा दर्ज',
      data: { amount: expense.amount, category: expense.category, description: expense.description },
    });
  } else {
    const responses: Record<string, string[]> = {
      hi: [
        'नमस्ते जी! मैं VAANI हूं, आपका वित्तीय सलाहकार। बताइए, आज मैं आपकी कैसे मदद कर सकता हूं? चाहे FD हो, SIP हो, या बचत — सब बता दूंगा।',
        'जी बिल्कुल! आपकी बचत की चिंता मुझे समझ आती है। एक काम करिए — हर दिन का खर्चा मुझे बोल दीजिए, मैं हिसाब रखूंगा। धीरे-धीरे बचत बढ़ेगी!',
        'अच्छा सवाल! अभी SBI में FD पर 6.8% ब्याज मिल रहा है, जबकि HDFC में 7%. अगर पैसा 2 साल के लिए लगाना है तो HDFC बेहतर रहेगा।',
        'आपकी वित्तीय स्थिति अच्छी दिख रही है जी। इस महीने आपने ₹42,350 खर्च किया, और बचत ₹42,650 है। शाबाश!',
      ],
      en: [
        "Hello! I'm VAANI, your financial advisor. How can I help you today? Whether it's FD, SIP, or savings — I've got you covered.",
        "Great question! SBI currently offers 6.8% on FD, while HDFC offers 7%. For a 2-year term, HDFC would give better returns.",
        "Your finances look good this month. You've spent ₹42,350 and saved ₹42,650. Keep it up!",
        "I can help you track expenses, compare FD rates, suggest government schemes, and plan your investments. Just ask!",
      ],
    };

    const langResponses = responses[language] || responses.hi;
    response = langResponses[Math.floor(Math.random() * langResponses.length)];
  }

  // Simulate streaming
  const words = response.split(' ');
  for (const word of words) {
    await new Promise(r => setTimeout(r, 30 + Math.random() * 50));
    options?.onToken?.(word + ' ');
  }

  options?.onDone?.(response);
  return response;
}

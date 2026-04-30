// ═══════════════════════════════════════════════════════════════════
// VAANI Chat Service — MiniMax M2.7 Streaming AI + Feature Routing
// ═══════════════════════════════════════════════════════════════════

import { API_CONFIG, APP_CONFIG, DIALECT_METAPHORS, GOVERNMENT_SCHEMES } from '../constants';
import type { ChatMessage, ActionCard } from '../types';
import { matchCommand, extractEntities } from './voiceCommandService';
import idleMoney from './idleMoneyService';
import taxIntel from './taxIntelligenceService';
import freelancer from './freelancerService';
import commandCenter from './commandCenterService';
import spendAwareness from './spendAwarenessService';
import creditIntel from './creditIntelligenceService';

// ─── Strip Think Tags (MiniMax M2.7 internal reasoning) ─────────
function stripThinkTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/<\|think\|>[\s\S]*?<\|\/think\|>/g, '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
    .replace(/<\|start_think\|>[\s\S]*?<\|end_think\|>/g, '')
    .trim();
}

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
1. EXPENSE TRACKING: Extract amount, category, description. Format: [EXPENSE:amount:category:description]
2. BUDGET ALERTS: Warn if spending exceeds 80% of budget
3. FD/SIP ADVICE: Compare rates, laddering, TDS
4. GOVERNMENT SCHEMES: ${GOVERNMENT_SCHEMES.map((s: { name: string }) => s.name).join(', ')}
5. IDLE MONEY: Detect idle bank balance, suggest liquid funds
6. TAX INTELLIGENCE: Tax harvesting, advance tax, 80C tracker, TDS detection
7. FREELANCER OS: Income logging, client tracking, GST invoices
8. NET WORTH: Live net worth, debt picture, FIRE calculator
9. SPEND AWARENESS: Purchase intent check, opportunity cost
10. CREDIT INTELLIGENCE: Portfolio-backed loans, borrowing capacity

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

    // Build message history (last 10 messages)
    const history = messages.slice(-10).map(m => ({
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

    // Clean response (remove action tags + think tags)
    const cleanResponse = stripThinkTags(cleanActionTags(fullResponse));
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

  const cleanedResponse = stripThinkTags(response);
  options?.onDone?.(cleanedResponse);
  return cleanedResponse;
}

// ═══════════════════════════════════════════════════════════════════
// FEATURE INTENT HANDLER — Routes to all 6 feature services
// Called before AI fallback for instant responses
// ═══════════════════════════════════════════════════════════════════

export async function handleFeatureIntent(text: string, userId: string, language: string = 'hi'): Promise<string | null> {
  const cmd = matchCommand(text);
  if (!cmd) return null;

  const entities = extractEntities(text);

  try {
    switch (cmd.action) {
      // ── Idle Money ──
      case 'check_idle_money': {
        const detection = await idleMoney.detectIdleMoney(userId);
        if (!detection) return 'Abhi aapke account mein idle paisa nahi dikh raha. Sab jagah laga hua hai!';
        return idleMoney.generateIdleMoneyVoiceAlert(detection, language);
      }
      case 'update_balance': {
        if (entities.bankName && entities.amount) {
          await idleMoney.updateAccountBalance(userId, entities.bankName, entities.amount);
          return `${entities.bankName} ka balance ₹${entities.amount.toLocaleString('en-IN')} update kar diya.`;
        }
        return 'Bank ka naam aur balance batao — jaise "SBI mein 50000 hai"';
      }
      case 'invest_idle_money': {
        const detection = await idleMoney.detectIdleMoney(userId);
        if (detection) {
          const earnings = idleMoney.calculateExtraEarnings(detection.detected_amount);
          return `₹${detection.detected_amount.toLocaleString('en-IN')} liquid fund mein lagaane se saal mein ₹${earnings.extraEarnings.toLocaleString('en-IN')} extra milenge. Kisi bhi bank app se HDFC Liquid Fund mein invest kar sakte ho.`;
        }
        return 'Pehle apne bank balance update karo, phir idle money check karenge.';
      }

      // ── Tax Intelligence ──
      case 'check_tax_harvest': {
        const opps = await taxIntel.analyzeTaxHarvesting(userId);
        if (opps.length === 0) return 'Abhi koi tax harvesting opportunity nahi hai. Sab holdings theek hain.';
        const top = opps[0];
        return `${top.recommendation}. Kul ₹${opps.reduce((s, o) => s + o.savings, 0).toLocaleString('en-IN')} bacha sakte ho tax mein.`;
      }
      case 'advance_tax_status': {
        const income = entities.amount || 800000;
        const deadlines = await taxIntel.calculateAdvanceTax(userId, income);
        const next = deadlines.find(d => d.days_remaining > 0 && d.balance_due > 0);
        if (!next) return 'Advance tax sab bhara hua hai. Tension mat lo!';
        return taxIntel.generateAdvanceTaxAlert(next);
      }
      case 'check_80c': {
        const status = await taxIntel.get80CStatus(userId);
        if (status.remaining === 0) return '80C ka pura ₹1,50,000 limit use ho gaya hai. Badhiya!';
        return `Aapka ₹${status.remaining.toLocaleString('en-IN')} 80C limit baaki hai. ${status.suggestions[0] || ''}`;
      }
      case 'tax_saving_tips': {
        const status = await taxIntel.get80CStatus(userId);
        if (status.suggestions.length === 0) return '80C limit pura ho gaya hai. NPS mein ₹50,000 aur daal do — extra deduction milega.';
        return status.suggestions.join('. ');
      }

      // ── Freelancer OS ──
      case 'log_income': {
        if (entities.clientName && entities.amount) {
          const result = await freelancer.logIncome(userId, entities.clientName, entities.amount);
          return result.voiceConfirmation;
        }
        return 'Client ka naam aur amount batao — jaise "Infosys se 50000 aaye"';
      }
      case 'client_summary': {
        const clients = await freelancer.getClientTracker(userId);
        if (clients.length === 0) return 'Abhi tak koi client income log nahi ki. Boliye "payment aaya [client] se [amount]"';
        return clients.slice(0, 3).map(c => `${c.client_name}: ₹${c.total_paid.toLocaleString('en-IN')} (${c.payment_count} payments)`).join('. ');
      }
      case 'generate_invoice': {
        if (entities.clientName && entities.amount) {
          const result = await freelancer.generateInvoice(userId, entities.clientName, entities.amount, 'Professional Services');
          return result.voiceConfirmation;
        }
        return 'Client ka naam aur amount batao — jaise "Infosys ke liye 50000 ka invoice"';
      }
      case 'itr_export': {
        const data = await freelancer.generateITRExport(userId);
        return `ITR data ready — kul income ₹${data.total_income.toLocaleString('en-IN')}, ${data.income_by_client.length} clients se, TDS ₹${data.tds_deducted.toLocaleString('en-IN')}. CA ko bhej sakte ho.`;
      }
      case 'income_summary': {
        return await freelancer.getIncomeSummaryVoice(userId);
      }

      // ── Command Center ──
      case 'read_net_worth': {
        const nw = await commandCenter.getExtendedNetWorth(userId);
        return commandCenter.generateNetWorthVoice(nw, language);
      }
      case 'debt_summary': {
        const debt = await commandCenter.getDebtSummary(userId);
        return commandCenter.generateDebtVoice(debt, language);
      }
      case 'fire_progress': {
        const fire = await commandCenter.calculateFIRE(userId);
        if (!fire) return 'FIRE goal set nahi hai. Boliye "retire 50 saal mein 5 crore chahiye" toh set kar deta hoon.';
        return commandCenter.generateFIREVoice(fire);
      }
      case 'add_loan': {
        if (entities.amount && entities.loanType) {
          const months = entities.months || 60;
          await commandCenter.addLoanByVoice(userId, entities.loanType, entities.bankName || 'Bank', entities.amount, months);
          return `${entities.loanType} loan add kar diya — ₹${entities.amount.toLocaleString('en-IN')} EMI, ${months} mahine.`;
        }
        return 'Loan type, EMI amount aur tenure batao — jaise "home loan 25000 EMI 240 mahine"';
      }

      // ── Spend Awareness ──
      case 'purchase_check': {
        if (entities.amount && entities.item) {
          const result = await spendAwareness.checkPurchaseIntent(userId, entities.item, entities.amount);
          if (!result.shouldAsk) return 'Yeh zaroori kharcha hai, kar lo.';
          return result.voiceAlert;
        }
        return 'Kya kharidna hai aur kitne ka — jaise "phone kharidna hai 15000 ka"';
      }
      case 'monthly_summary': {
        const summary = await spendAwareness.generateMonthlySummary(userId);
        return summary.voice_summary;
      }
      case 'opportunity_cost': {
        const amt = entities.amount || 1000;
        const result = spendAwareness.calculateOpportunityCost(amt);
        return result.voiceExplanation;
      }

      // ── Credit Intelligence ──
      case 'credit_options': {
        const amt = entities.amount || 100000;
        const comparison = await creditIntel.getPortfolioBackedOptions(userId, amt);
        return comparison.voice_explanation;
      }
      case 'borrowing_capacity': {
        const cap = await creditIntel.calculateBorrowingCapacity(userId, entities.amount);
        return creditIntel.generateCapacityVoice(cap);
      }
      case 'cheaper_than_cc': {
        const amt = entities.amount || 50000;
        const result = await creditIntel.suggestCheaperAlternative(userId, amt);
        if (!result.hasCheaper) return 'Abhi aapke paas koi collateral nahi hai. FD ya mutual fund mein invest karo, phir sasta loan milega.';
        return result.voiceAlert;
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('[FeatureIntent] Error:', error);
    return null;
  }
}

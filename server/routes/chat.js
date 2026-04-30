import express from 'express';
import { sanitizeInput, isOffTopicRequest, stripThinkTags, VAANI_SYSTEM_PROMPT } from '../utils/security.js';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MINIMAX_ENDPOINT = 'https://api.minimax.io/v1/text/chatcompletion_v2';

// Recommendation engine weights (multi-factor scoring model)
const WEIGHTS = { goalFit: 0.35, liquidity: 0.25, returnPotential: 0.20, riskAlignment: 0.10, tenureFit: 0.10 };

// ─── FD DATA (9 Banks — April 2025 Rates) ────────────────────────────────────

const FD_DATA = [
  // Public Sector Banks
  { 
    bank: 'SBI', type: 'psu',
    tenures: { '7d': 3.50, '30d': 4.75, '90d': 5.50, '180d': 6.50, '1y': 6.80, '2y': 7.00, '3y': 6.75, '5y': 6.50 }
  },
  { 
    bank: 'Bank of Baroda', type: 'psu',
    tenures: { '7d': 3.00, '30d': 4.50, '90d': 5.75, '180d': 6.50, '1y': 6.85, '2y': 7.15, '3y': 7.00, '5y': 6.50 }
  },
  // Private Banks
  { 
    bank: 'HDFC Bank', type: 'private',
    tenures: { '7d': 3.50, '30d': 4.75, '90d': 6.00, '180d': 6.75, '1y': 7.10, '2y': 7.20, '3y': 7.00, '5y': 7.00 }
  },
  { 
    bank: 'ICICI Bank', type: 'private',
    tenures: { '7d': 3.00, '30d': 4.75, '90d': 6.00, '180d': 6.75, '1y': 7.10, '2y': 7.20, '3y': 7.00, '5y': 7.00 }
  },
  { 
    bank: 'Axis Bank', type: 'private',
    tenures: { '7d': 3.50, '30d': 5.75, '90d': 6.00, '180d': 6.75, '1y': 7.10, '2y': 7.26, '3y': 7.10, '5y': 7.00 }
  },
  // High-Yield Private
  { 
    bank: 'Yes Bank', type: 'private',
    tenures: { '7d': 3.25, '30d': 5.00, '90d': 6.25, '180d': 7.25, '1y': 7.75, '2y': 7.75, '3y': 7.25, '5y': 7.25 }
  },
  { 
    bank: 'IndusInd Bank', type: 'private',
    tenures: { '7d': 4.00, '30d': 6.00, '90d': 7.00, '180d': 7.50, '1y': 7.99, '2y': 7.75, '3y': 7.25, '5y': 7.25 }
  },
  // Small Finance Banks — highest rates, DICGC insured up to ₹5L
  { 
    bank: 'Suryoday SFB', type: 'sfb',
    tenures: { '7d': 4.00, '30d': 6.00, '90d': 7.00, '180d': 8.00, '1y': 9.10, '2y': 8.60, '3y': 8.25, '5y': 7.50 }
  },
  { 
    bank: 'Utkarsh SFB', type: 'sfb',
    tenures: { '7d': 4.50, '30d': 6.00, '90d': 7.00, '180d': 7.75, '1y': 8.50, '2y': 8.25, '3y': 8.00, '5y': 7.50 }
  },
  {
    bank: 'AU Small Finance Bank', type: 'sfb',
    tenures: { '7d': 3.75, '30d': 6.00, '90d': 7.00, '180d': 7.50, '1y': 8.00, '2y': 7.75, '3y': 7.50, '5y': 7.25 }
  },
];

const SIP_DATA = [
  { name: 'HDFC Top 100 Fund', category: 'large-cap', risk: 7 },
  { name: 'SBI Bluechip Fund', category: 'large-cap', risk: 7 },
  { name: 'UTI Nifty Index Fund', category: 'index', risk: 6 },
  { name: 'HDFC Short Term Debt Fund', category: 'debt', risk: 3 },
  { name: 'SBI Liquid Fund', category: 'liquid', risk: 2 },
];

// ─── PROFILE-AWARE FD RECOMMENDATIONS ─────────────────────────────────────────

function getFDRecommendations(profile = {}, limit = 3) {
  const amount = profile.amount || 0;
  const isSenior = profile.isSenior || false;
  const scored = [];
  
  for (const b of FD_DATA) {
    for (const [tenure, rate] of Object.entries(b.tenures)) {
      const seniorRate = isSenior ? rate + 0.5 : rate;
      
      // Profile-aware scoring
      let baseScore = 0.35 * 0.8 + 0.25 * 0.6 + 0.20 * (rate / 9) + 0.10 * 0.7;
      
      // Senior citizens get slight boost for stability
      if (isSenior) baseScore += 0.05;
      
      // For amounts < ₹5L: prioritize SFBs (highest insured rates)
      if (amount > 0 && amount < 500000) {
        if (b.type === 'sfb') baseScore += 0.15; // SFBs are best for small amounts
      }
      
      // For amounts >= ₹5L: suggest spreading across banks
      if (amount >= 500000 && tenure === '1y') {
        baseScore += 0.10; // Encourage 1-year ladder for large amounts
      }
      
      // DICGC insurance awareness
      const dicgcInsured = true; // All banks up to ₹5L per depositor
      const explanation = getFDExplanation(b.bank, tenure, seniorRate, b.type, isSenior);
      
      scored.push({
        name: `${b.bank} ${tenure} FD`,
        rate: rate,
        seniorRate: seniorRate,
        score: Math.round(baseScore * 100) / 100,
        type: b.type,
        dicgcInsured,
        explanation,
      });
    }
  }
  
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function getFDExplanation(bank, tenure, rate, type, isSenior) {
  const seniorBonus = isSenior ? ' — senior citizen benefit adds 0.5% extra' : '';
  
  if (type === 'sfb') {
    return `${bank} mein ${rate}% byaaj milega — DICGC se ₹5 lakh tak surakshit hai${seniorBonus}. Chhoti bank hai par bada faayda!`;
  } else if (type === 'psu') {
    return `${bank} ek bada sarkari bank hai. ${rate}% byaaj milega${seniorBonus} — bharosa badhiya, rate thoda kam hai.`;
  } else {
    return `${bank} mein ${rate}% byaaj milega${seniorBonus} — bada private bank, acchi credibility.`;
  }
}

function getSIPRecommendations(profile = {}, limit = 3) {
  const scored = SIP_DATA.map(f => {
    const r = f.risk / 10;
    const score = 0.35 * 0.7 + 0.25 * 0.6 + 0.20 * r + 0.10 * Math.abs(r - 0.5) + 0.10 * 0.7;
    return { name: f.name, category: f.category, score: Math.round(score * 100) / 100 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

function checkRecommendationIntent(text) {
  const lower = text.toLowerCase();
  if (lower.includes('fd') && (lower.includes('suggest') || lower.includes('recommend') || lower.includes('best') || lower.includes('konsa'))) {
    return 'fd';
  }
  if (lower.includes('sip') && (lower.includes('suggest') || lower.includes('recommend') || lower.includes('mutual'))) {
    return 'sip';
  }
  return null;
}

// ─── Check Finance Intent (VAANI Features) ───────────────────────────────────
function checkFinanceIntent(text) {
  const lower = text.toLowerCase();
  
  // Expense
  if (lower.includes('kharch') || lower.includes('expense') || lower.includes('spent') || lower.includes('kharcha') || lower.includes('खर्च') || lower.includes('add expense')) {
    return 'expense';
  }
  
  // Idle Money
  if (lower.includes('idle') || lower.includes('पैसा पड़ा') || lower.includes('free balance') || lower.includes('bikhar')) {
    return 'idle';
  }
  
  // Tax
  if (lower.includes('tax') || lower.includes('कर') || lower.includes('tds') || lower.includes('ltcg') || lower.includes('tax intelligence')) {
    return 'tax';
  }
  
  // Freelancer / Income
  if (lower.includes('income') || lower.includes('कमाई') || lower.includes('client') || lower.includes('bheja') || lower.includes('भेजा') || lower.includes('freelancer')) {
    return 'freelance';
  }
  
  // Net Worth / FIRE
  if (lower.includes('daulat') || lower.includes('net worth') || lower.includes('total kitna') || lower.includes('wealth') || lower.includes('दौलत') || lower.includes('command center')) {
    return 'networth';
  }
  
  // Add investment
  if (lower.includes('fd add') || lower.includes('sip add') || lower.includes('invest')) {
    return 'invest';
  }
  
  return null;
}

// ─── Format Finance Response ─────────────────────────────────────────────────
function formatFinanceResponse(type, lang) {
  const responses = {
    expense: {
      hi: '📝 Expense add karne ke liye simple bolo: "₹500 chai" ya "₹2000 rent" — main log kar dunga!',
      en: '📝 Just say: "₹500 for chai" or "₹2000 rent" — I\'ll log it!',
    },
    idle: {
      hi: '💰 Aapke bank mein idle paisa detect kar raha hoon. Main check karta hoon ki kya aapka Paisa zyada better jagah invest ho sakta hai!',
      en: '💰 Checking for idle money in your accounts. Your money might be better invested somewhere!',
    },
    tax: {
      hi: '📊 Aapka tax status check kar raha hoon. Advance tax deadline ya tax saving options bataunga!',
      en: '📊 Checking your tax status. I\'ll tell you about advance tax deadlines and tax saving options!',
    },
    freelance: {
      hi: '🧾 Aapke income ka record rakhna hai? Bolo "Rahul ne ₹25,000 bheja" — main log kar dunga!',
      en: '🧾 Want to track income? Say "Rahul paid ₹25,000" — I\'ll log it!',
    },
    networth: {
      hi: '🏦 Aapki kul daulat calculate kar raha hoon — FD, SIP, Crypto, Gold sab add kar raha hoon!',
      en: '🏦 Calculating your total net worth — adding FD, SIP, Crypto, Gold all together!',
    },
    invest: {
      hi: '📈 Naya investment add karna hai? FD ya SIP? Bolo bank ka naam aur amount!',
      en: '📈 Want to add new investment? FD or SIP? Tell me the bank and amount!',
    },
  };
  
  return responses[type]?.[lang] || responses[type]?.en || 'Something went wrong!';
}

function formatRecommendationResponse(type, results, lang) {
  const label = type === 'fd' ? 'FD' : 'SIP';
  const top = results[0];
  
  if (type === 'fd' && top.explanation) {
    // Use explanation for FD recommendations
    if (lang === 'hi') {
      return `${top.explanation}. Score: ${top.score}%.`;
    }
    return `${top.name} at ${top.seniorRate}% ${top.isSenior ? '(senior rate)' : ''}. ${top.explanation}. Score: ${top.score}%.`;
  }
  
  if (lang === 'hi') {
    return `आपके लिए सबसे अच्छा ${label}: ${top.name} (${top.rate || top.category}। Score: ${top.score}%)। Benefits: ${top.rate ? 'उच्च ब्याज दर' : 'म्यूचुअल फंड में निवेश'}`;
  }
  return `Top ${label} recommendation: ${top.name} (${top.rate || top.category}). Score: ${top.score}%. Benefits: ${top.rate ? 'High interest rate' : 'Diversified investment'}`;
}

// ─── MAIN CHAT ROUTE ──────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { message, language, emotionState, chatHistory, systemPrompt } = req.body;

    const lang = language || 'hi';
    
    // Guard 1: Sanitize input
    const rawMessage = message?.trim() || '';
    const cleanMessage = sanitizeInput(rawMessage);
    
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Message required' });
    }
    
    // Guard 2: Off-topic block
    if (isOffTopicRequest(cleanMessage)) {
      const block = lang === 'hi' 
        ? 'Main sirf aapka financial advisor hoon. Paisa, bachat, nivesh — yahi mere kaam ki baatein hain. Koi financial sawaal hai?'
        : 'I am only a financial advisor. I can help with savings, investments, taxes, and budgeting. What financial question can I help with?';
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.flushHeaders();
      
      for (const word of block.split(' ')) {
        res.write(`data: ${word} \n`);
        await new Promise(r => setTimeout(r, 20));
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
    
    // Check for recommendation intent first
    const recType = checkRecommendationIntent(cleanMessage);
    if (recType) {
      const recResults = recType === 'fd' ? getFDRecommendations({}, 3) : getSIPRecommendations({}, 3);
      const recResponse = formatRecommendationResponse(recType, recResults, lang);
      
      // Stream recommendation response
      const words = recResponse.split(' ');
      for (const word of words) {
        res.write(`data: ${word} \n`);
        await new Promise(r => setTimeout(r, 15));
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
    
    // Check for VAANI finance feature intents
    const financeType = checkFinanceIntent(cleanMessage);
    if (financeType) {
      const financeResponse = formatFinanceResponse(financeType, lang);
      
      const words = financeResponse.split(' ');
      for (const word of words) {
        res.write(`data: ${word} \n`);
        await new Promise(r => setTimeout(r, 15));
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Build messages array — NEVER use req.body.systemPrompt
    const messages = [
      { role: 'system', content: VAANI_SYSTEM_PROMPT },
      ...(Array.isArray(chatHistory) ? chatHistory.slice(-6).map(h => ({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: sanitizeInput(h.content || ''),  // sanitize history too
      })) : []),
      { role: 'user', content: cleanMessage },  // use cleanMessage not message
    ];

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let fullResponse = '';

    // Try MiniMax M2.7 first (user's preferred model)
    if (MINIMAX_API_KEY) {
      try {
        const response = await fetch(MINIMAX_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'MiniMax-M2.7',
            messages: messages,
            max_tokens: 512,
            temperature: 0.8,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          fullResponse = 
            data?.choices?.[0]?.message?.content ||
            data?.choices?.[0]?.messages?.[0]?.content ||
            '';
          
          if (!fullResponse) {
            console.error('[MiniMax] Empty response. Raw:', JSON.stringify(data).slice(0, 300));
          }
          
          // Strip think tags
          fullResponse = stripThinkTags(fullResponse);
          
          if (fullResponse) {
            // Stream word by word
            const words = fullResponse.split(' ');
            for (const word of words) {
              res.write(`data: ${word} \n`);
              await new Promise(r => setTimeout(r, 20));
            }
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
        } else {
          console.error('[chat] MiniMax M2.7 error:', response.status, await response.text());
        }
      } catch (apiErr) {
        console.error('[chat] MiniMax API error:', apiErr.message);
      }
    }

    // Try Groq as fallback (free tier)
    if (!fullResponse && GROQ_API_KEY) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            max_tokens: 200,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          fullResponse = 
            data?.choices?.[0]?.message?.content ||
            data?.choices?.[0]?.messages?.[0]?.content ||
            '';
          
          if (!fullResponse) {
            console.error('[Groq] Empty response. Raw:', JSON.stringify(data).slice(0, 300));
          }
          
          // Strip think tags
          fullResponse = stripThinkTags(fullResponse);
          
          if (fullResponse) {
            // Stream word by word
            const words = fullResponse.split(' ');
            for (const word of words) {
              res.write(`data: ${word} \n`);
              await new Promise(r => setTimeout(r, 20));
            }
            res.write('data: [DONE]\n\n');
            res.end();
            return;
          }
        }
      } catch (apiErr) {
        console.error('[chat] Groq error:', apiErr.message);
      }
    }

    // Try Gemini as second fallback
    if (!fullResponse && GEMINI_API_KEY) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
              generationConfig: { temperature: 0.8, maxOutputTokens: 512 },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          fullResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          // Strip think tags
          fullResponse = stripThinkTags(fullResponse);
        }
      } catch (geminiErr) {
        console.error('[chat] Gemini fallback error:', geminiErr.message);
      }
    }

    // Final fallback - multilingual responses
    if (!fullResponse) {
      const fallbacks = {
        hi: 'Namaskar! Main VAANI hoon, aapka financial advisor. Aap mujhse FD rates, SIP, ya koi bhi financial question puchh sakte hain. Main aapki madad ke liye hoon!',
        en: 'Namaste! I am VAANI, your financial assistant. You can ask me about FD rates, SIP investments, or any financial topic. I am here to help!',
        bn: 'নমস্কার! আমি VAANI, আপনার আর্থিক উপদেষ্টা। আপনি FD রেট, SIP বা যেকোনো আর্থিক বিষয়ে জিজ্ঞাসা করতে পারেন।',
        te: 'Namaste! Na VAANI, mee financial advisor. FD rates, SIP, ela chesthunna financial question.',
        ta: 'வணக்கம்! நான் VAANI, உங்கள் financial advisor. FD விகிதங்கள், SIP அல்லது நிதி தொடர்பான ஏதேனும் கேள்ளி கேட்கலாம.',
        mr: 'नमस्कार! मी VAANI, तुमचा financial advisor. तुम्ही मला FD rates, SIP किंवा कोणत्याही financial विषयाबद्दल विचारू शकता.',
        gu: 'નમસ્કાર! હું VAANI, તમારો financial advisor. તમે મને FD rates, SIP કે કોઈપણ financial વિષે પૂછી શકો છો.',
        kn: 'ನಮಸ್ಕಾರ! ನಾನು VAANI, ನಿಮ್ಮ financial advisor. ನೀವು FD rates, SIP ಅಥವಾ ಯಾವುದೇ financial ವಿಷಯದ ಬಗ್ಗೆ ಕೇಳಬಹುದು.',
        ml: 'നമസ്കാരം! ഞാന്‍ VAANI, നിങ്ങളുടെ financial advisor. നിങ്ങള്‍ക്ക് FD നിരക്ക്, SIP അല്ലെങ്കില്‍ ഏതെങ്കിലും സാമ്പത്തിക ചോദ്യം ചെയ്യാം.',
        pa: 'ਨਮਸਕਾਰ! ਮੈਂ VAANI, ਤੁਹਾਡਾ ਵਿੱਤੀ ਸਲਾਹਕਾਰ। ਤੁਸੀਂ ਮੈਨੂੰ FD ਦਰਾਂ, SIP ਜਾਂ ਕਿਸੇ ਵੀ ਵਿੱਤੀ ਵਿਸ਼ੇ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।',
        ur: 'السلام علیکم! میں VAANI، آپ کا مالی مشیر ہوں۔ آپ مجھ سے FD کی شرحوں، SIP یا کسی بھی مالی موضوع کے بارے میں پوچھ سکتے ہیں۔',
      };
      fullResponse = fallbacks[lang] || fallbacks.default;
    }

    // Stream fallback response
    const words = fullResponse.split(' ');
    for (const word of words) {
      res.write(`data: ${word} \n`);
      await new Promise(r => setTimeout(r, 20));
    }
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('[chat] Unhandled error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat service temporarily unavailable' });
    } else {
      res.end();
    }
  }
});

export default router;
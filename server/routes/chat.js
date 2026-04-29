import express from 'express';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MINIMAX_ENDPOINT = 'https://api.minimax.io/v1/text/chatcompletion_v2';

// Recommendation engine weights (multi-factor scoring model)
const WEIGHTS = { goalFit: 0.35, liquidity: 0.25, returnPotential: 0.20, riskAlignment: 0.10, tenureFit: 0.10 };

const FD_DATA = [
  { bank: 'SBI', tenures: { '1y': 5.10, '2y': 5.10, '3y': 5.10, '5y': 5.10 } },
  { bank: 'HDFC Bank', tenures: { '1y': 5.15, '2y': 5.15, '3y': 5.30, '5y': 5.40 } },
  { bank: 'ICICI Bank', tenures: { '1y': 5.15, '2y': 5.15, '3y': 5.25, '5y': 5.35 } },
  { bank: 'Yes Bank', tenures: { '1y': 5.50, '2y': 5.50, '3y': 5.50, '5y': 5.50 } },
];

const SIP_DATA = [
  { name: 'HDFC Top 100 Fund', category: 'large-cap', risk: 7 },
  { name: 'SBI Bluechip Fund', category: 'large-cap', risk: 7 },
  { name: 'UTI Nifty Index Fund', category: 'index', risk: 6 },
  { name: 'HDFC Short Term Debt Fund', category: 'debt', risk: 3 },
  { name: 'SBI Liquid Fund', category: 'liquid', risk: 2 },
];

function getFDRecommendations(profile = {}, limit = 3) {
  const scored = [];
  for (const b of FD_DATA) {
    for (const [tenure, rate] of Object.entries(b.tenures)) {
      const seniorRate = profile.isSenior ? rate + 0.5 : rate;
      const r = profile.riskAppetite === 'low' ? 1 : profile.riskAppetite === 'moderate' ? 0.6 : 0.3;
      const score = 0.35 * 0.8 + 0.25 * 0.6 + 0.20 * (rate / 8) + 0.10 * r + 0.10 * 0.7;
      scored.push({ name: `${b.bank} ${tenure} FD`, rate: seniorRate, score: Math.round(score * 100) / 100 });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
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

function formatRecommendationResponse(type, results, lang) {
  const label = type === 'fd' ? 'FD' : 'SIP';
  const top = results[0];
  if (lang === 'hi') {
    return `आपके लिए सबसे अच्छा ${label}: ${top.name} (${top.rate || top.category}। Score: ${top.score}%)। Benefits: ${top.rate ? 'उच्च ब्याज दर' : 'म्यूचुअल फंड में निवेश'}`;
  }
  return `Top ${label} recommendation: ${top.name} (${top.rate || top.category}). Score: ${top.score}%. Benefits: ${top.rate ? 'High interest rate' : 'Diversified investment'}`;
}

router.post('/', async (req, res) => {
  try {
    const { message, language, emotionState, chatHistory, systemPrompt } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const lang = language || 'hi';
    
    // Check for recommendation intent first
    const recType = checkRecommendationIntent(message);
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
    
    // Language-specific system prompts
    const systemPrompts = {
      hi: `आप VAANI हैं, भारत के ग्रामीण क्षेत्रों के लिए एक भरोसेमंद वित्तीय सलाहकार। आप हिंदी में बात करते हैं। FD = "गल्ला बंध" (fixed deposit), SIP = "हर महीने निवेश"। 150 शब्दों से कम जवाब दें।`,
      en: `You are VAANI, a trusted voice-first financial advisor for India. Use village-level analogies. Keep responses under 150 words.`,
      default: `You are VAANI, a trusted financial advisor. Keep responses under 150 words.`,
    };
    const systemMsg = systemPrompt || systemPrompts[lang] || systemPrompts.default;

    // Build messages array
    const messages = [
      { role: 'system', content: systemMsg },
      ...(chatHistory || []).map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
      { role: 'user', content: message },
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
          fullResponse = data?.choices?.[0]?.message?.content || '';
          
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
            model: 'llama-3.1-70b-versatile',
            messages: messages,
            max_tokens: 200,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          fullResponse = data?.choices?.[0]?.message?.content || '';
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
        }
      } catch (geminiErr) {
        console.error('[chat] Gemini fallback error:', geminiErr.message);
      }
    }

    // Final fallback - multilingual responses
    if (!fullResponse) {
      const fallbacks = {
        hi: 'Namaskar! Main VAANI hoon, aapka financial advisor. Aap mujhse FD rates, SIP, ya koi bhi financial question puchh sakte hain. ₹5000 se ₹1 lakh tak ka investment kar sakte hain. FD mein 7% se 9% tak annual return milta hai. main aapki madad ke liye hoon!',
        en: 'Namaste! I am VAANI, your financial assistant. You can ask me about FD rates (7-9% annual), SIP investments, or any financial topic. I can help with amounts from ₹5,000 to ₹10 lakh. How can I help you today?',
        bn: 'নমস্কার! আমি VAANI, আপনার আর্থিক উপদেষ্টা। আপনি FD রেট (বার্ষিক ৭-৯%), SIP বা যেকোনো আর্থিক বিষয়ে জিজ্ঞাসা করতে পারেন। ₹5,000 থেকে ₹10 লক্ষ পর্যন্ত বিনিয়োগ করতে পারেন।',
        te: 'Namaste! Na VAANI, mee financial advisor. FD rates (7-9% per year), SIP, ela chesthunna question济चेसतु न्नु. ₹5,000 न्ने ₹10 lakh varaku investment chesthuna.',
        ta: 'வணக்கம்! நான் VAANI, உங்கள் financial advisor. FD விகிதங்கள் ( ஆண்டுக்கு 7-9%), SIP அல்லது நிதி தொடர்பான ஏதேனும் கேள்ளி கேட்கலாம. ₹5,000 முதல் ₹10 லக்கு வரை முதலீடு செய்யலாம.',
        mr: 'नमस्कार! मी VAANI, तुमचा financial advisor. FD दर (वार्षिक 7-9%), SIP किंवा कोणत्याही financial विषयाबद्दल विचारू शकता. ₹5,000 ते ₹10 लास पर्यंत invest करू शकता.',
        gu: 'નમસ્કાર! હું VAANI, તમારો financial advisor. FD દર (વાર્ષિક 7-9%), SIP કે કોઈપણ financial વિષે પૂછી શકો છો. ₹5,000 થી ₹10 લાખ સુધીનું investment કરી શકો છો.',
        kn: 'ನಮಸ್ಕಾರ! ನಾನು VAANI, ನಿಮ್ಮ financial advisor. FD ದರಗಳು (ವಾರ್ಷಿಕ 7-9%), SIP ಅಥವಾ ಯಾವುದೇ financial ವಿಷಯದ ಬಗ್ಗೆ ಕೇಳಬಹುದು. ₹5,000 ರಿಂದ ₹10 ಲಕ್ಷದ ವರೆಗೆ invest ಮಾಡಬಹುದು.',
        ml: 'നമസ്കാരം! ഞാന്‍ VAANI, നിങ്ങളുടെ സാമ്പത്തിക ഉപദഷ്ടാവ്. FD നിരക്ക് (വാര്‍ഷിക 7-9%), SIP അല്ലെങ്കില്‍ ഏതെങ്കിലും സാമ്പത്തിക ചോദ്യം ചോദ്യം ചെയ്യാം. ₹5,000 മുതല്‍ ₹10 ലക്ഷം വരെ invest ചെയ്യാം.',
        pa: 'ਨਮਸਕਾਰ! ਮੈਂ VAANI, ਤੁਹਾਡਾ ਵਿੱਤੀ ਸਲਾਹਕਾਰ। ਤੁਸੀਂ ਮੈਨੂੰ FD ਦਰਾਂ (ਸਾਲਾਨਾ 7-9%), SIP ਜਾਂ ਕਿਸੇ ਵੀ ਵਿੱਤੀ ਵਿਸ਼ੇ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ। ₹5,000 ਤੋਂ ₹10 ਲੱਖ ਤਕ ਦਾ ਵਿਨਵੇਸ਼ਨ ਕਰ ਸਕਦਾ ਹੈ।',
        ur: 'السلام علیکم! میں VAANI، آپ کا مالی مشیر ہوں۔ آپ مجھ سے FD کی شرلوں (سالانہ 7-9%)، SIP یا کسی بھی مالی موضوع کے بارے میں پوچھ سکتے ہیں۔ ₹5,000 سے ₹10 لکہ تک کی سرمایہ کاری کر سکتے ہیں۔',
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
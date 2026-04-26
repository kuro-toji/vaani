import express from 'express';

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MINIMAX_ENDPOINT = 'https://api.minimax.io/v1/text/chatcompletion_v2';

const BANK_PRODUCTS = [
  { bank: 'Suryoday', rate: '9.1%', tenor: '18 months', note: 'Extra 0.25% for senior citizens' },
  { bank: 'Utkarsh', rate: '8.5%', tenor: '12 months', note: 'No penalty on early withdrawal' },
  { bank: 'Jana', rate: '8.25%', tenor: '24 months', note: 'Best for 2-year lock-in' },
];

router.post('/', async (req, res) => {
  try {
    const { message, language, emotionState, chatHistory, systemPrompt } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const lang = language || 'hi';
    
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

    // Try Groq first (free tier, faster)
    if (GROQ_API_KEY) {
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

    // Try MiniMax if Groq failed
    if (!fullResponse && MINIMAX_API_KEY) {
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
            stream: true,
            max_tokens: 512,
            temperature: 0.8,
          }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (!line.trim() || line.startsWith(':')) continue;

                let parsed;
                try {
                  parsed = JSON.parse(line);
                } catch {
                  const match = line.match(/^data:\s*(.+)/);
                  if (match) {
                    try { parsed = JSON.parse(match[1]); } catch { continue; }
                  } else { continue; }
                }

                const content = parsed?.choices?.[0]?.delta?.content
                  || parsed?.choices?.[0]?.message?.content
                  || parsed?.choices?.[0]?.messages?.[0]?.content
                  || '';

                if (content) {
                  res.write(`data: ${content}\n`);
                }
              }
            }
          } catch (streamErr) {
            console.error('[chat] Stream read error:', streamErr.message);
          }

          res.write('data: [DONE]\n');
          res.end();
          return;
        }
      } catch (apiErr) {
        console.error('[chat] MiniMax API error:', apiErr.message);
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
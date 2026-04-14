import { useState, useCallback, useRef, useEffect } from 'react';
import { detectLanguage } from '../services/languageDetector.js';
import { sendToMiniMax } from '../services/minimaxService.js';
import { enqueueRequest } from '../services/requestQueue.js';
import { detectTopic, buildTrimmedPrompt, buildCompactOverview } from '../services/promptTrimmer.js';
import { encryptData, decryptData } from '../services/cryptoService.js';
import { findSchemes, detectSchemeIntent } from '../services/schemeService.js';
import { compareFDRates, detectTenure } from '../services/fdService.js';
import { checkEligibility, detectEligibilityIntent } from '../services/eligibilityService.js';
import { captureLead, detectProductInterest } from '../services/leadService.js';
import { useVoice } from './useVoice.js';
import { useVibration } from './useVibration.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getGreeting } from '../data/greetings.js';

export function useChat() {
  const [messages, setMessages] = useState(() => {
    // If loading for the first time, check if they have a saved language
    const savedLang = localStorage.getItem('vaani_language') || 'hi';
    const initGreeting = getGreeting(savedLang);
    return [
      {
        id: 'greeting_user',
        role: 'user',
        content: initGreeting.user,
        timestamp: new Date(),
      },
      {
        id: 'greeting_assistant',
        role: 'assistant',
        content: initGreeting.ai,
        timestamp: new Date(),
      }
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Subscribe to global language from LanguageContext
  const { language: contextLanguage, setLanguage: setContextLanguage } = useLanguage();
  const language = contextLanguage || 'hi';
  const [isLanguageManual, setIsLanguageManual] = useState(false);
  const [isMuted, setMuted] = useState(false);

  const { speak, stopSpeaking } = useVoice();
  const { vibrateOnAIResponse, vibrateOnRecordingStart, vibrateThinking, stopVibration } = useVibration();
  const idCounter = useRef(0);
  const messagesRef = useRef([]);

  // Keep ref in sync with state
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Handle changing the preview messages whenever the language explicitly changes
  useEffect(() => {
    if (messages.length === 2 && messages[0].id === 'greeting_user' && messages[1].id === 'greeting_assistant') {
      const greetingArgs = getGreeting(language);
      
      // Update only if the language actively changed and doesn't match the current screen state
      if (messages[1].content !== greetingArgs.ai) {
        setMessages([
          {
            id: 'greeting_user',
            role: 'user',
            content: greetingArgs.user,
            timestamp: new Date(),
          },
          {
            id: 'greeting_assistant',
            role: 'assistant',
            content: greetingArgs.ai,
            timestamp: new Date(),
          }
        ]);
      }
    }
  }, [language, messages]);

  // Reset greeting messages when global context language changes (after mount)
  useEffect(() => {
    if (!contextLanguage) return;
    if (messages.length > 2) return; // Don't override user conversation
    if (messages[0]?.id !== 'greeting_user' || messages[1]?.id !== 'greeting_assistant') return;
    const newGreeting = getGreeting(contextLanguage);
    setMessages([
      { id: 'greeting_user', role: 'user', content: newGreeting.user, timestamp: new Date() },
      { id: 'greeting_assistant', role: 'assistant', content: newGreeting.ai, timestamp: new Date() },
    ]);
  }, [contextLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load saved messages on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vaani_messages');
      if (saved) {
        const decrypted = decryptData(saved);
        if (decrypted && Array.isArray(decrypted) && decrypted.length > 0) {
          setMessages(decrypted);
        }
      }
    } catch (e) {
      console.warn('Could not load saved messages:', e);
    }
  }, []);

  // Save messages to localStorage on every change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem('vaani_messages', encryptData(messages));
      }
    } catch (e) {
      console.warn('Could not save messages:', e);
    }
  }, [messages]);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      // Landing page detection takes priority (most recent user action)
      const detectedLang = sessionStorage.getItem('vaani_detected_language');
      const savedLang = localStorage.getItem('vaani_language');
      const savedMuted = localStorage.getItem('vaani_isMuted');

      if (detectedLang) {
        setContextLanguage(detectedLang);
        setIsLanguageManual(true);
        // Clear so it doesn't override future auto-detection on reload
        sessionStorage.removeItem('vaani_detected_language');
      } else if (savedLang) {
        setContextLanguage(savedLang);
      }

      if (savedMuted === '1') setMuted(true);
    } catch (e) {}
  }, []);

  const generateId = () => {
    idCounter.current += 1;
    return `${Date.now()}-${idCounter.current}`;
  };

  const sendMessage = useCallback(async (text, fromVoice = false) => {
    if (!text.trim() || isLoading) return;

    // Stop any ongoing TTS when user sends a new message
    stopSpeaking();

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    if (!isMuted) vibrateThinking();

    // Declare outside try so catch block can access them
    let currentLanguage = contextLanguage;
    let topic = null;
    let allMessages = [...messagesRef.current, userMessage];

    // ── Scheme Finder Interception ──────────────────────────────────────
    // Intercept gov scheme queries and answer from real data
    const detectedIntent = await detectSchemeIntent(text);
    
    if (detectedIntent || /scheme|scam|योजना|स्कीम|सरकारी|govt|government|benefit/i.test(text)) {
      try {
        const lang = contextLanguage || 'hi';
        const schemes = await findSchemes({
          query: text,
          language: lang,
          maxResults: 3,
          gender: text.includes('beti') || text.includes('daughter') || text.includes('maa') ? 'female' : undefined,
        });
        
        if (schemes && schemes.length > 0) {
          const schemeList = schemes.map((s, i) => 
            `${i + 1}. **${s.name}**: ${s.description}`
          ).join('\n');
          
          const aiMessage = {
            id: generateId(),
            role: 'assistant',
            content: `यहाँ आपके लिए सरकारी योजनाएँ मिलीं:\n\n${schemeList}\n\nविवरण जानना है किसी योजना का? बोलिए!`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          
          if (!isMuted && fromVoice) {
            speak(schemes[0].description, lang);
          }
          
          stopVibration();
          setIsLoading(false);
          return;
        }
      } catch (schemeErr) {
        // Fall through to MiniMax if scheme lookup fails
        console.warn('Scheme lookup failed:', schemeErr);
      }
    }

    // ── FD Rate Interception ────────────────────────────────────────────
    const fdKeywords = /fd|fixed deposit|term deposit|सावधि|ब्याज दर|bank deposit|highest rate|best fd/i;
    if (fdKeywords.test(text)) {
      try {
        const lang = contextLanguage || 'hi';
        const tenure = detectTenure(text);
        const isSenior = /senior|बुज़ुर्ग|elderly|बड़े|bade/i.test(text);
        const rates = compareFDRates({ tenure, isSenior, language: lang, maxResults: 5 });
        
        if (rates && rates.length > 0) {
          const rateList = rates.map((b, i) => 
            `${i + 1}. ${b.logo} **${b.bank_short}**: ${b.rate}% ${b.senior_extra > 0 ? `(Sr. Citizen: ${b.rate}%)` : ''}`
          ).join('\n');
          const tenureLabel = rates[0]?.tenure_label || tenure;
          
          const aiMessage = {
            id: generateId(),
            role: 'assistant',
            content: `🏦 **FD Rates (${tenureLabel})** ${isSenior ? '(Senior Citizen)' : ''}:\n\n${rateList}\n\n*Rates are indicative. Check with bank before investing.*`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          
          if (!isMuted && fromVoice) {
            speak(`सबसे अच्छी FD rate: ${rates[0].bank_short} में ${rates[0].rate} प्रतिशत। विवरण के लिए बोलिए।`, lang);
          }
          
          stopVibration();
          setIsLoading(false);
          return;
        }
      } catch (fdErr) {
        console.warn('FD lookup failed:', fdErr);
      }
    }

    // ── Bank & CSC Locator Interception ──────────────────────────────────
    if (detectLocatorIntent(text)) {
      try {
        const lang = contextLanguage || 'hi';
        const pincode = localStorage.getItem('vaani_pincode') || '';
        
        if (pincode && pincode.length === 6) {
          const { findNearbyBanksAndCSC } = await import('../services/locatorService.js');
          const result = await findNearbyBanksAndCSC({ pincode, language: lang });
          
          if (result && result.banks) {
            const bankList = result.banks.map((b, i) => 
              `${i + 1}. ${b.logo} **${b.short}**: 📞 ${b.phone}`
            ).join('\n');
            
            const cscText = result.csc ? 
              `\n📍 **CSC (Common Service Centre)**: ${result.csc.name}\n   📞 ${result.csc.phone}\n   💡 ${result.csc.howToFind}` : '';
            
            const aiMessage = {
              id: generateId(),
              role: 'assistant',
              content: `🏧 **Nearest Banks & CSC for PIN ${pincode}:**\n\n${bankList}${cscText}\n\n${result.tip}`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMessage]);
            
            if (!isMuted && fromVoice) {
              speak(`आपके pincode ${pincode} में nearest bank है ${result.banks[0].short}`, lang);
            }
            
            stopVibration();
            setIsLoading(false);
            return;
          }
        } else {
          // Ask for pincode
          const aiMessage = {
            id: generateId(),
            role: 'assistant',
            content: lang === 'hi'
              ? '🏧 आपका pincode बताइए — नearest bank और CSC बताऊँ।'
              : '🏧 Tell me your pincode — I will find the nearest bank and CSC.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          
          if (!isMuted && fromVoice) {
            speak(lang === 'hi' ? 'आपका pincode बताइए' : 'Tell me your pincode', lang);
          }
          
          stopVibration();
          setIsLoading(false);
          return;
        }
      } catch (locErr) {
        console.warn('Locator failed:', locErr);
        // Fall through to MiniMax
      }
    }

    // ── Eligibility Checker Interception ─────────────────────────────────
    const eligibilityIntent = detectEligibilityIntent(text);
    if (eligibilityIntent) {
      try {
        const lang = contextLanguage || 'hi';
        const pincode = localStorage.getItem('vaani_pincode') || '';
        
        const result = await checkEligibility({
          intent: eligibilityIntent,
          userMessage: text,
          language: lang,
          pincode,
        });
        
        if (result.done) {
          // Final eligibility result
          const aiMessage = {
            id: generateId(),
            role: 'assistant',
            content: result.response,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          
          // Capture lead if eligible
          if (result.eligible?.eligible) {
            try {
              await captureLead({
                productCategory: eligibilityIntent,
                pincode,
                language: lang,
                source: 'chat',
              });
            } catch {}
          }
          
          if (!isMuted && fromVoice) {
            speak(result.response, lang);
          }
        } else {
          // Ask the next eligibility question
          const questionText = `📋 ${result.question}`;
          const aiMessage = {
            id: generateId(),
            role: 'assistant',
            content: questionText,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, aiMessage]);
          
          if (!isMuted && fromVoice) {
            speak(result.question, lang);
          }
        }
        
        stopVibration();
        setIsLoading(false);
        return;
      } catch (eligErr) {
        console.warn('Eligibility check failed:', eligErr);
        // Fall through to MiniMax
      }
    }

    // ── Lead Capture — after scheme results ───────────────────────────────
    if (/apply|register|contact|call me|callback|जानकारी|विवरण/i.test(text)) {
      const productInterest = detectProductInterest(text);
      if (productInterest) {
        try {
          const lang = contextLanguage || 'hi';
          await captureLead({
            productCategory: productInterest,
            pincode: localStorage.getItem('vaani_pincode') || '',
            language: lang,
            source: 'chat',
          });
          const leadMsg = {
            id: generateId(),
            role: 'assistant',
            content: lang === 'hi'
              ? '✅ धन्यवाद! हम आपको जल्द ही contact करेंगे। Vaani team.'
              : '✅ Thank you! We will contact you soon. - Vaani Team',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, leadMsg]);
          stopVibration();
          setIsLoading(false);
          return;
        } catch (leadErr) {
          console.warn('Lead capture failed:', leadErr);
        }
      }
    }

    try {
      // Detect language if not manually set
      if (!isLanguageManual) {
        currentLanguage = await detectLanguage(text);
        setContextLanguage(currentLanguage);
      }

      // Detect topic from user's message
      topic = detectTopic(text);

      // Build optimized prompt — only relevant category, trimmed history
      // True first message = only greetings exist before this user message
      const isFirstRealMessage = messagesRef.current.filter(
        m => m.id !== 'greeting_user' && m.id !== 'greeting_assistant'
      ).length === 0;

      const systemPrompt = isFirstRealMessage
        ? buildCompactOverview(currentLanguage)
        : buildTrimmedPrompt(currentLanguage, topic, allMessages);

      // Enqueue the request (auto-spaces calls, retries on 429)
      const response = await enqueueRequest(() => sendToMiniMax(allMessages, systemPrompt));

      // Add AI response
      const aiMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Stop thinking vibration and do response vibration
      stopVibration();

      // Vibration feedback for AI response (only when not muted)
      if (!isMuted) {
        vibrateOnAIResponse();
      }

      // Speak AI response aloud (only when user SPOKE their message, not typed)
      if (!isMuted && fromVoice) {
        speak(response, currentLanguage);
      }
    } catch (error) {
      // Add error message in the detected language
      const errorContent =
        language === 'hi'
          ? 'कुछ गलत हो गया, कृपया पुनः प्रयास करें।'
          : language === 'bn'
            ? 'কিছু ভুল হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Something went wrong, please try again.';

      setError(error.message || 'Unknown error');

      const errorMessage = {
        id: generateId(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      if (!isMuted) {
        vibrateOnAIResponse();
      }
    } finally {
      setIsLoading(false);
      stopVibration();
    }
  }, [isLoading, isLanguageManual, messages, isMuted, stopSpeaking, speak, vibrateOnAIResponse, vibrateThinking, stopVibration]);

  const setLanguageManual = useCallback((code) => {
    setIsLanguageManual(true);  // mark manual
    setContextLanguage(code);    // propagate globally
  }, [setContextLanguage]);

  const resetLanguageToAuto = useCallback(() => {
    setIsLanguageManual(false);
  }, []);

  // Expose vibration trigger for STT recording start (called from ChatInput)
  const triggerRecordingVibration = useCallback(() => {
    vibrateOnRecordingStart();
  }, [vibrateOnRecordingStart]);

  return {
    messages,
    isLoading,
    error,
    language,
    isLanguageManual,
    sendMessage,
    setLanguageManual,
    resetLanguageToAuto,
    setMuted,
    isMuted,
    triggerRecordingVibration,
  };
}

import { useState, useCallback, useRef, useEffect } from 'react';
import { detectLanguage } from '../services/languageDetector.js';
import { sendToGemini } from '../services/geminiService.js';
import { sendToOllama, isOllamaAvailable } from '../services/ollamaService.js';
import { enqueueRequest } from '../services/requestQueue.js';
import { detectTopic, buildTrimmedPrompt, buildCompactOverview } from '../services/promptTrimmer.js';
import { useVoice } from '../hooks/useVoice.js';

export function useChat() {
  const [messages, setMessages] = useState([
    {
      id: 'greeting_user',
      role: 'user',
      content: 'helo',
      timestamp: new Date(),
    },
    {
      id: 'greeting_assistant',
      role: 'assistant',
      content: 'नमस्ते! कैसे हैं आप? बताइए, मैं आपकी क्या मदद कर सकती हूँ? किसी भी पैसे से जुड़ी बात पर हम दोस्त की तरह बात कर सकते हैं।',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('hi');
  const [isLanguageManual, setIsLanguageManual] = useState(false);
  const [isMuted, setMuted] = useState(false);

  const { speak, stopSpeaking } = useVoice();
  const idCounter = useRef(0);
  const messagesRef = useRef([]);

  // Keep ref in sync with state
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const generateId = () => {
    idCounter.current += 1;
    return `${Date.now()}-${idCounter.current}`;
  };

  const sendMessage = useCallback(async (text) => {
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

    try {
      // Detect language if not manually set
      let currentLanguage = language;
      if (!isLanguageManual) {
        currentLanguage = await detectLanguage(text);
        setLanguage(currentLanguage);
      }

      // Detect topic from user's message
      const topic = detectTopic(text);

      // Build optimized prompt — only relevant category, trimmed history
      const isFirstMessage = messagesRef.current.length === 0;
      const systemPrompt = isFirstMessage 
        ? buildCompactOverview()
        : buildTrimmedPrompt(currentLanguage, topic, [...messagesRef.current, userMessage]);

      // Get all messages including the new user message  
      const allMessages = [...messagesRef.current, userMessage];

      // Enqueue the request (auto-spaces calls, retries on 429)
      const response = await enqueueRequest(() => sendToGemini(allMessages, systemPrompt));

      // Add AI response
      const aiMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Speak AI response aloud (non-blocking)
      if (!isMuted) {
        speak(response, currentLanguage);
      }
    } catch (error) {
      // Try Ollama as fallback before giving up
      let response = null;
      const isRateLimit = error.message.includes('429') || error.message.includes('rate') || error.message.includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit) {
        try {
          const ollamaAvailable = await isOllamaAvailable();
          if (ollamaAvailable) {
            const ollamaPrompt = buildTrimmedPrompt(currentLanguage, topic, allMessages);
            response = await sendToOllama(allMessages, ollamaPrompt);
          }
        } catch (ollamaError) {
          console.error('Ollama fallback also failed:', ollamaError);
        }
      }
      
      if (response) {
        // Use Ollama response
        const aiMessage = {
          id: generateId(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        
        // Speak AI response aloud (non-blocking)
        if (!isMuted) {
          speak(response, currentLanguage);
        }
      } else {
        // Add error message in the detected language
        const errorContent =
          language === 'hi'
            ? 'कुछ गलत हो गया, कृपया पुनः प्रयास करें।'
            : language === 'bn'
              ? 'কিছু ভুল হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।'
              : 'Something went wrong, please try again.';

        const errorMessage = {
          id: generateId(),
          role: 'assistant',
          content: errorContent,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, language, isLanguageManual, messages, isMuted, stopSpeaking, speak]);

  const setLanguageManual = useCallback((code) => {
    setLanguage(code);
    setIsLanguageManual(true);
  }, []);

  const resetLanguageToAuto = useCallback(() => {
    setIsLanguageManual(false);
  }, []);

  return {
    messages,
    isLoading,
    language,
    isLanguageManual,
    sendMessage,
    setLanguageManual,
    resetLanguageToAuto,
    setMuted,
    isMuted,
  };
}

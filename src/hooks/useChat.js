import { useState, useCallback, useRef, useEffect } from 'react';
import { detectLanguage } from '../services/languageDetector.js';
import { sendToGemini } from '../services/geminiService.js';
import { sendToOllama, isOllamaAvailable } from '../services/ollamaService.js';
import { enqueueRequest } from '../services/requestQueue.js';
import { detectTopic, buildTrimmedPrompt, buildCompactOverview } from '../services/promptTrimmer.js';
import { useVoice } from './useVoice.js';
import { useVibration } from './useVibration.js';

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
  const { vibrateOnAIResponse, vibrateOnRecordingStart } = useVibration();
  const idCounter = useRef(0);
  const messagesRef = useRef([]);

  // Keep ref in sync with state
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Load saved messages on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vaani_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
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
        localStorage.setItem('vaani_messages', JSON.stringify(messages));
      }
    } catch (e) {
      console.warn('Could not save messages:', e);
    }
  }, [messages]);

  // Save language preference
  useEffect(() => {
    try {
      localStorage.setItem('vaani_language', language);
      localStorage.setItem('vaani_isMuted', isMuted ? '1' : '0');
    } catch (e) {}
  }, [language, isMuted]);

  // Load saved preferences on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('vaani_language');
      const savedMuted = localStorage.getItem('vaani_isMuted');
      if (savedLang) setLanguage(savedLang);
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

      // Vibration feedback for AI response (only when not muted)
      if (!isMuted) {
        vibrateOnAIResponse();
      }

      // Speak AI response aloud (only when user SPOKE their message, not typed)
      if (!isMuted && fromVoice) {
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
        
        // Vibration feedback for AI response (only when not muted)
        if (!isMuted) {
          vibrateOnAIResponse();
        }

        // Speak AI response aloud (only when user SPOKE their message)
        if (!isMuted && fromVoice) {
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

        // Vibration feedback for error message (only when not muted)
        if (!isMuted) {
          vibrateOnAIResponse();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, language, isLanguageManual, messages, isMuted, stopSpeaking, speak, vibrateOnAIResponse]);

  const setLanguageManual = useCallback((code) => {
    setLanguage(code);
    setIsLanguageManual(true);
  }, []);

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
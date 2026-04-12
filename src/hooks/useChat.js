import { useState, useCallback, useRef, useEffect } from 'react';
import { detectLanguage } from '../services/languageDetector.js';
import { sendToGemini } from '../services/geminiService.js';
import { sendToOllama, isOllamaAvailable } from '../services/ollamaService.js';
import { enqueueRequest } from '../services/requestQueue.js';
import { detectTopic, buildTrimmedPrompt, buildCompactOverview } from '../services/promptTrimmer.js';
import { encryptData, decryptData } from '../services/cryptoService.js';
import { useVoice } from './useVoice.js';
import { useVibration } from './useVibration.js';
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
  const [language, setLanguage] = useState('hi');
  const [isLanguageManual, setIsLanguageManual] = useState(false);
  const [isMuted, setMuted] = useState(false);

  const { speak, stopSpeaking } = useVoice();
  const { vibrateOnAIResponse, vibrateOnRecordingStart } = useVibration();
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
        ? buildCompactOverview(currentLanguage)
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
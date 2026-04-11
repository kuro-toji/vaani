import { useState, useCallback, useRef } from 'react';
import { detectLanguage } from '../services/languageDetector.js';
import { buildSystemPrompt } from '../services/promptBuilder.js';
import { sendToGemini } from '../services/geminiService.js';
import { useVoice } from '../hooks/useVoice.js';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState('hi');
  const [isLanguageManual, setIsLanguageManual] = useState(false);
  const [isMuted, setMuted] = useState(false);

  const { speak, stopSpeaking } = useVoice();
  const idCounter = useRef(0);

  const generateId = () => {
    idCounter.current += 1;
    return `${Date.now()}-${idCounter.current}`;
  };

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    // Stop any ongoing TTS when user sends a new message
    stopVoice();

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

      // Build system prompt with detected language
      const systemPrompt = buildSystemPrompt(currentLanguage);

      // Get all messages including the new user message
      const allMessages = [...messages, userMessage];

      // Call Gemini service
      const response = await sendToGemini(allMessages, systemPrompt);

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
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, language, isLanguageManual, messages, isMuted, stopVoice, speak]);

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

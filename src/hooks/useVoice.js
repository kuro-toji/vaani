import { useState, useEffect, useRef, useCallback } from 'react';

const LANGUAGE_CODE_MAP = {
  hi: 'hi-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  mr: 'mr-IN',
  ur: 'ur-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  or: 'or-IN',
  pa: 'pa-IN',
  ne: 'ne-NP',
  as: 'as-IN',
  mai: 'hi-IN',
  sat: 'hi-IN',
  ks: 'ks-IN',
  sd: 'sd-IN',
  kok: 'kok-IN',
  dgo: 'dgo-IN',
  brx: 'brx-IN',
  mni: 'mni-IN',
  sa: 'sa-IN',
  bho: 'hi-IN',
  raj: 'hi-IN',
  hne: 'hi-IN',
  tcy: 'tcy-IN',
  bgc: 'bgc-IN',
  mag: 'mag-IN',
  en: 'en-US',
};

const TTS_LANGUAGE_CODE_MAP = { ...LANGUAGE_CODE_MAP };

const getLanguageCode = (lang) => LANGUAGE_CODE_MAP[lang] || 'en-US';
const getTTSLanguageCode = (lang) => TTS_LANGUAGE_CODE_MAP[lang] || 'en-US';

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sttError, setSttError] = useState(false);
  const [voices, setVoices] = useState([]);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  const startListening = useCallback((onResult, onError, language = 'hi') => {
    setSttError(false);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.('SpeechRecognition API not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getLanguageCode(language);

    recognition.onresult = (event) => {
      try {
        let transcript = '';
        let isFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          isFinal = event.results[i].isFinal;
        }
        console.log('STT:', transcript);
        if (transcript.trim()) {
           onResult?.(transcript, isFinal);
        }
      } catch (err) {
        console.error('STT Processing Error:', err);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error, language);
      if (['language-not-supported', 'not-allowed', 'no-speech', 'audio-capture'].includes(event.error)) {
        setSttError(true);
      }
      setIsListening(false);
      onError?.(event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error('STT Start Error:', e);
      setIsListening(false);
      onError?.(e.message);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const speak = useCallback((text, language = 'hi') => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getTTSLanguageCode(language);
    utterance.rate = 0.9;
    
    const langCode = getTTSLanguageCode(language);
    const matchingVoice = voices.find((v) => v.lang.startsWith(langCode.split('-')[0]));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const v = window.speechSynthesis.getVoices();
        if (v.length > 0) setVoices(v);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  return { isListening, isSpeaking, sttError, setSttError, startListening, stopListening, speak, stopSpeaking };
};

export default useVoice;

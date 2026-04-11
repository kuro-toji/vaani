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

const TTS_LANGUAGE_CODE_MAP = {
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

const getLanguageCode = (lang) => {
  return LANGUAGE_CODE_MAP[lang] || 'hi-IN';
};

const getTTSLanguageCode = (lang) => {
  return TTS_LANGUAGE_CODE_MAP[lang] || 'hi-IN';
};

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);
  const isSpeakingRef = useRef(false);

  const startListening = useCallback((onResult, onError, language = 'hi') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onError?.('SpeechRecognition API not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getLanguageCode(language);

    recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        isFinal = event.results[i].isFinal;
      }
      onResult?.(transcript, isFinal);
    };

    recognition.onerror = (event) => {
      onError?.(event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const speak = useCallback((text, language = 'hi') => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getTTSLanguageCode(language);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const langCode = getTTSLanguageCode(language);
    const matchingVoice = voices.find(
      (voice) => voice.lang.startsWith(langCode.split('-')[0])
    );
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      isSpeakingRef.current = true;
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      isSpeakingRef.current = false;
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
        recognitionRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};

export default useVoice;
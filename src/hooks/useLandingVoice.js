import { useState, useEffect, useRef, useCallback } from 'react';

export function useLandingVoice(onResult) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  
  // Keep onResult ref updated
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);
  
  const startListening = useCallback(() => {
    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // Hindi default for India
    
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript('');
    };
    
    recognition.onresult = (e) => {
      let finalTranscript = '';
      for (let i = 0; i < e.results.length; i++) {
        finalTranscript += e.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
    };
    
    recognition.onerror = (e) => {
      if (e.error === 'no-speech') {
        // Not an error, user just didn't speak
        setIsListening(false);
        return;
      }
      setError(e.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      if (transcript && onResultRef.current) {
        onResultRef.current(transcript);
      }
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  }, []); // Empty deps - transcript accessed via ref if needed
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscript(''); // Reset on stop
  }, []);
  
  return { isListening, transcript, error, startListening, stopListening };
}

export default useLandingVoice;
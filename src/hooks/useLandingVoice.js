import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useLandingVoice — Speech recognition hook for pincode input on landing page.
 * 
 * Uses 'en-IN' language for reliable digit recognition.
 * Sets continuous=false so it auto-stops after a phrase.
 * Fires onResult callback with the full transcript on every interim/final result.
 */
export function useLandingVoice() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const onResultCallbackRef = useRef(null);
  const transcriptRef = useRef('');
  
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
        recognitionRef.current = null;
      }
    };
  }, []);
  
  const startListening = useCallback((onResult) => {
    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Please use Chrome.');
      return;
    }
    
    onResultCallbackRef.current = onResult;
    transcriptRef.current = '';
    setTranscript('');
    setError(null);
    setIsListening(true);
    
    const recognition = new SpeechRecognition();
    // Use English-IN for reliable digit recognition ("one two three" → "1 2 3")
    recognition.lang = 'en-IN';
    // Auto-stop after a single phrase — user says "1 1 0 0 0 1" and it stops
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (e) => {
      let currentTranscript = '';
      
      for (let i = 0; i < e.results.length; i++) {
        currentTranscript += e.results[i][0].transcript;
      }
      
      // Update BOTH ref and state
      transcriptRef.current = currentTranscript;
      setTranscript(currentTranscript);
      
      // Call callback with current transcript on every result (interim + final)
      if (currentTranscript && onResultCallbackRef.current) {
        onResultCallbackRef.current(currentTranscript);
      }
    };
    
    recognition.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') {
        setIsListening(false);
        return;
      }
      console.error('Speech recognition error:', e.error);
      setError(e.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
      // Fire final result using the REF (state is async/stale in this closure)
      const finalTranscript = transcriptRef.current;
      if (finalTranscript && onResultCallbackRef.current) {
        onResultCallbackRef.current(finalTranscript);
      }
    };
    
    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError(err.message);
      setIsListening(false);
    }
  }, []);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      // Don't null out the ref here — let onend fire first to process final transcript
    }
    setIsListening(false);
  }, []);
  
  return { isListening, transcript, error, startListening, stopListening };
}

export default useLandingVoice;
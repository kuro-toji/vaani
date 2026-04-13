import { useState, useEffect, useRef, useCallback } from 'react';
import { matchCommand, executeCommand } from '../services/voiceNavigationCommands';

export function useVoiceNavigation() {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState(null);
  const recognitionRef = useRef(null);
  
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    // Stop existing if any
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsListening(true);
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    
    recognition.onresult = (e) => {
      for (let i = 0; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        const command = matchCommand(transcript);
        
        if (command) {
          setLastCommand(command);
          executeCommand(command);
        }
      }
    };
    
    recognition.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.error('Voice navigation error:', e.error);
      }
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;
    recognition.start();
  }, []);
  
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  return { isListening, lastCommand, startListening, stopListening };
}

export default useVoiceNavigation;

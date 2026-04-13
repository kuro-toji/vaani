import { useState, useEffect, useRef, useCallback } from 'react';
import { langToSpeechLocale, extractDigitsFromText } from '../data/indianDigitMap.js';

/**
 * useLandingVoice — Dual-mode speech recognition hook for pincode input.
 *
 * Mode 1 — Web Speech API: fast, no server round-trip.
 *   - Works in Chrome/Edge. Breaks in Brave (blocks Google speech servers).
 *   - On network / not-allowed / service-not-allowed error: falls through to Mode 2.
 *
 * Mode 2 — Groq Whisper: records audio with MediaRecorder, sends to
 *   Groq Whisper API (https://api.groq.com/openai/v1/audio/transcriptions).
 *   - Language always 'en' — pincode digits are universally spoken in English.
 *   - Auto-stops recording after 5 seconds (pincode is max 6 digits).
 *   - Works in Brave, Firefox, Safari, and any browser with getUserMedia support.
 */
export function useLandingVoice() {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  // Web Speech recognition instance
  const recognitionRef = useRef(null);
  // MediaRecorder instance for Groq fallback
  const mediaRecorderRef = useRef(null);
  // Active MediaStream (mic) for cleanup
  const streamRef = useRef(null);
  // Auto-stop timer handle
  const autoStopTimerRef = useRef(null);
  // Callback reference (stable across recognition restarts)
  const onResultCallbackRef = useRef(null);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
        recognitionRef.current = null;
      }
      clearAutoStop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function clearAutoStop() {
    if (autoStopTimerRef.current !== null) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
  }

  function stopAllStreamTracks() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function stopMediaRecorder() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }

  function stopRecognition() {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
  }

  // ── Groq Whisper fallback ──────────────────────────────────────────────────
  /**
   * Requests microphone, records for up to 5 seconds, then transcribes via
   * Groq Whisper API and calls onResult with extracted digits.
   */
  async function startGroqWhisperFallback(onResult, lang) {
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (micErr) {
      setError('Microphone access denied. Please allow mic and try again.');
      setIsListening(false);
      return;
    }

    // Determine supported MIME type
    let mimeType = 'audio/webm';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    }

    const chunks = [];
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      clearAutoStop();
      stopAllStreamTracks();
      setIsListening(false);

      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        setError('Voice not supported in this browser — please type your pincode');
        return;
      }

      const blob = new Blob(chunks, { type: mimeType });

      try {
        const formData = new FormData();
        formData.append('file', blob, 'pincode.webm');
        formData.append('model', 'whisper-large-v3');
        formData.append('language', 'en');

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errBody = await response.text();
          console.error('Groq API error:', response.status, errBody);
          setError('Voice transcription failed. Please type your pincode.');
          return;
        }

        const data = await response.json();
        const digits = extractDigitsFromText(data.text || '');
        onResult(digits);
      } catch (fetchErr) {
        console.error('Groq fetch failed:', fetchErr);
        setError('Voice transcription failed. Please type your pincode.');
      }
    };

    recorder.onerror = (e) => {
      console.error('MediaRecorder error:', e);
      clearAutoStop();
      stopAllStreamTracks();
      setIsListening(false);
      setError('Recording failed. Please type your pincode.');
    };

    recorder.start();
    setIsListening(true);

    // Auto-stop after 5 seconds
    autoStopTimerRef.current = setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
      clearAutoStop();
    }, 5000);
  }

  // ── startListening ─────────────────────────────────────────────────────────
  /**
   * Starts voice input for the given language.
   *
   * @param {Function} onResult  — called with extracted digit string: onResult(digits)
   * @param {string}   lang      — language code (e.g. 'en', 'hi', 'bn')
   *
   * Flow:
   *  1. Detect Brave → skip Web Speech entirely, go straight to Groq.
   *  2. Try Web Speech API.
   *     - On 'network' | 'not-allowed' | 'service-not-allowed' error → fall through to Groq.
   *  3. Groq Whisper fallback (covers Brave + all Web Speech failures).
   */
  const startListening = useCallback((onResult, lang = 'en') => {
    // Reset state
    setError(null);
    onResultCallbackRef.current = onResult;
    clearAutoStop();
    stopRecognition();
    stopMediaRecorder();

    // ── Step 1: Brave detection — skip Web Speech entirely ─────────────────
    const isBrave = !!navigator.brave;
    if (isBrave) {
      startGroqWhisperFallback(onResult, lang);
      return;
    }

    // ── Step 2: Try Web Speech API ─────────────────────────────────────────
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      // Not available — fall through to Groq
      startGroqWhisperFallback(onResult, lang);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = langToSpeechLocale[lang] || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      let transcript = '';
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      const digits = extractDigitsFromText(transcript);
      if (onResultCallbackRef.current) {
        onResultCallbackRef.current(digits);
      }
    };

    recognition.onerror = (e) => {
      // Only fall through to Groq for genuine failures, not user-abort scenarios
      const fallThroughErrors = ['network', 'not-allowed', 'service-not-allowed'];
      if (fallThroughErrors.includes(e.error)) {
        stopRecognition();
        startGroqWhisperFallback(onResult, lang);
        return;
      }

      if (e.error === 'no-speech' || e.error === 'aborted') {
        setIsListening(false);
        return;
      }

      console.error('Web Speech error:', e.error);
      setError(e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch (startErr) {
      console.error('Failed to start Web Speech:', startErr);
      stopRecognition();
      startGroqWhisperFallback(onResult, lang);
    }
  }, []);

  // ── stopListening ───────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    clearAutoStop();
    stopRecognition();
    stopMediaRecorder();
    stopAllStreamTracks();
    setIsListening(false);
  }, []);

  return { isListening, error, startListening, stopListening };
}

export default useLandingVoice;
/**
 * useVibration - Hook for haptic feedback on mobile devices
 * Provides vibration patterns for AI responses and STT recording
 */
import { useCallback } from 'react';

const AI_PATTERN = [100, 50, 100];     // vibrate 100ms, pause 50ms, vibrate 100ms
const STT_START_PATTERN = [50];        // short tap for recording start
const STT_SUCCESS_PATTERN = [100];     // success confirmation
const TAP_PATTERN = [30];             // light tap for buttons
const ERROR_PATTERN = [200, 100, 200]; // error buzz

export function useVibration() {
  const vibrate = useCallback((pattern = TAP_PATTERN) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Vibration not supported or blocked
      }
    }
  }, []);

  const vibrateOnAIResponse = useCallback(() => {
    vibrate(AI_PATTERN);
  }, [vibrate]);

  const vibrateOnRecordingStart = useCallback(() => {
    vibrate(STT_START_PATTERN);
  }, [vibrate]);

  const vibrateOnRecordingSuccess = useCallback(() => {
    vibrate(STT_SUCCESS_PATTERN);
  }, [vibrate]);

  const vibrateOnTap = useCallback(() => {
    vibrate(TAP_PATTERN);
  }, [vibrate]);

  const vibrateOnError = useCallback(() => {
    vibrate(ERROR_PATTERN);
  }, [vibrate]);

  return {
    vibrate,
    vibrateOnAIResponse,
    vibrateOnRecordingStart,
    vibrateOnRecordingSuccess,
    vibrateOnTap,
    vibrateOnError,
  };
}

export default useVibration;

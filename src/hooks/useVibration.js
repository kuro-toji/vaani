/**
 * useVibration - Hook for haptic feedback on mobile devices
 * Provides vibration patterns for AI responses and STT recording
 */
import { useCallback } from 'react';

const DEFAULT_AI_PATTERN = [100, 50, 100]; // vibrate 100ms, pause 50ms, vibrate 100ms
const STT_START_PATTERN = [50]; // short 50ms pulse for recording start

export function useVibration() {
  const vibrate = useCallback((pattern = DEFAULT_AI_PATTERN) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Vibration failed:', e);
      }
    }
  }, []);

  const vibrateOnAIResponse = useCallback(() => {
    vibrate(DEFAULT_AI_PATTERN);
  }, [vibrate]);

  const vibrateOnRecordingStart = useCallback(() => {
    vibrate(STT_START_PATTERN);
  }, [vibrate]);

  return {
    vibrate,
    vibrateOnAIResponse,
    vibrateOnRecordingStart,
  };
}

export default useVibration;
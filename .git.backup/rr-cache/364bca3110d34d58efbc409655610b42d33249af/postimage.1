/**
 * useVibration - Hook for haptic feedback on mobile devices
 * Provides vibration patterns for AI responses and STT recording
 */
import { useCallback } from 'react';

const DEFAULT_AI_PATTERN = [100, 50, 100]; // vibrate 100ms, pause 50ms, vibrate 100ms
const STT_START_PATTERN = [50]; // short 50ms pulse for recording start
const LISTENING_LOOP_PATTERN = [30, 2000]; // tiny pulse every 2s to indicate active mic
const THINKING_PATTERN = [20, 100, 20, 100, 20]; // rapid short pulses
const SPEAKING_LOOP_PATTERN = [50, 4000]; // gentle pulse every 4s while TTS plays

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

  const stopVibration = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }, []);

  const vibrateOnAIResponse = useCallback(() => {
    vibrate(DEFAULT_AI_PATTERN);
  }, [vibrate]);

  const vibrateOnRecordingStart = useCallback(() => {
    vibrate(STT_START_PATTERN);
  }, [vibrate]);

  const vibrateListeningLoop = useCallback(() => {
    vibrate(LISTENING_LOOP_PATTERN);
  }, [vibrate]);

  const vibrateThinking = useCallback(() => {
    vibrate(THINKING_PATTERN);
  }, [vibrate]);

  const vibrateSpeakingLoop = useCallback(() => {
    vibrate(SPEAKING_LOOP_PATTERN);
  }, [vibrate]);

  return {
    vibrate,
    stopVibration,
    vibrateOnAIResponse,
    vibrateOnRecordingStart,
    vibrateListeningLoop,
    vibrateThinking,
    vibrateSpeakingLoop
  };
}

export default useVibration;
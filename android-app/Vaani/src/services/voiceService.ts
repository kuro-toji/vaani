// ═══════════════════════════════════════════════════════════════════
// VAANI Voice Recording Service — Native Mic via expo-av
// ═══════════════════════════════════════════════════════════════════

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { VOICE_CONFIG } from '../constants';

let recording: Audio.Recording | null = null;
let silenceTimer: ReturnType<typeof setTimeout> | null = null;

// ─── Setup Audio Mode ───────────────────────────────────────────
export async function setupAudio(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return false;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    return true;
  } catch (error) {
    console.error('[Voice] Audio setup failed:', error);
    return false;
  }
}

// ─── Start Recording ────────────────────────────────────────────
export async function startRecording(
  onSilenceDetected?: () => void
): Promise<boolean> {
  try {
    if (recording) {
      await stopRecording();
    }

    // Tap noise delay
    await new Promise(r => setTimeout(r, VOICE_CONFIG.tap_noise_delay));

    const { recording: newRecording } = await Audio.Recording.createAsync(
      {
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
      },
      (status) => {
        // Voice Activity Detection
        if (status.isRecording && status.metering !== undefined) {
          const db = status.metering;
          // If audio is very quiet (below threshold), start silence timer
          if (db < -45) {
            if (!silenceTimer && onSilenceDetected) {
              silenceTimer = setTimeout(() => {
                onSilenceDetected();
              }, VOICE_CONFIG.vadSilenceThreshold);
            }
          } else {
            // Voice detected, reset silence timer
            if (silenceTimer) {
              clearTimeout(silenceTimer);
              silenceTimer = null;
            }
          }
        }
      },
      100 // Update interval in ms
    );

    recording = newRecording;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    return true;
  } catch (error) {
    console.error('[Voice] Start recording failed:', error);
    return false;
  }
}

// ─── Stop Recording ─────────────────────────────────────────────
export async function stopRecording(): Promise<{ uri: string; duration: number } | null> {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }

  if (!recording) return null;

  try {
    const status = await recording.getStatusAsync();
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    const duration = status.durationMillis || 0;
    recording = null;

    // Reset audio mode for playback
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (!uri) return null;

    // Minimum duration check
    if (duration < VOICE_CONFIG.min_recording_duration) {
      console.log('[Voice] Recording too short:', duration, 'ms');
      return null;
    }

    return { uri, duration };
  } catch (error) {
    console.error('[Voice] Stop recording failed:', error);
    recording = null;
    return null;
  }
}

// ─── Cancel Recording ───────────────────────────────────────────
export async function cancelRecording(): Promise<void> {
  if (silenceTimer) {
    clearTimeout(silenceTimer);
    silenceTimer = null;
  }
  if (recording) {
    try {
      await recording.stopAndUnloadAsync();
    } catch {}
    recording = null;
  }
}

// ─── Check if Recording ────────────────────────────────────────
export function isCurrentlyRecording(): boolean {
  return recording !== null;
}

// ─── Play Audio ─────────────────────────────────────────────────
export async function playAudio(uri: string): Promise<void> {
  try {
    const { sound } = await Audio.Sound.createAsync({ uri });
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if ('didJustFinish' in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('[Voice] Playback failed:', error);
  }
}

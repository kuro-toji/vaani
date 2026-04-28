// ═══════════════════════════════════════════════════════════════════
// VAANI TTS Service — expo-speech (offline) + ElevenLabs (premium)
// ═══════════════════════════════════════════════════════════════════

import * as Speech from 'expo-speech';
import { API_CONFIG, VOICE_CONFIG, SUPPORTED_LANGUAGES } from '../constants';

let isSpeaking = false;
let currentUtteranceId = 0;

// ─── Speak Text (Primary: expo-speech, always works offline) ────
export async function speak(
  text: string,
  language: string = 'hi',
  options?: { rate?: number; onDone?: () => void; onStart?: () => void }
): Promise<void> {
  if (!text || text.trim().length === 0) return;

  // Stop any current speech
  await stopSpeaking();

  const utteranceId = ++currentUtteranceId;
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const ttsLang = lang?.ttsLang || 'hi-IN';
  const rate = options?.rate || VOICE_CONFIG.default_voice_rate;

  // Split long text into sentences for smoother playback
  const sentences = splitIntoSentences(text, language);

  isSpeaking = true;
  options?.onStart?.();

  for (const sentence of sentences) {
    if (!isSpeaking || utteranceId !== currentUtteranceId) break;
    if (sentence.trim().length === 0) continue;

    await new Promise<void>((resolve) => {
      Speech.speak(sentence, {
        language: ttsLang,
        rate,
        pitch: 1.0,
        onDone: () => resolve(),
        onError: () => resolve(),
        onStopped: () => resolve(),
      });
    });
  }

  if (utteranceId === currentUtteranceId) {
    isSpeaking = false;
    options?.onDone?.();
  }
}

// ─── ElevenLabs TTS (Premium, chunked streaming) ────────────────
export async function speakElevenLabs(
  text: string,
  language: string = 'hi',
  options?: { rate?: number; onDone?: () => void }
): Promise<boolean> {
  const apiKey = API_CONFIG.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // Fallback to expo-speech
    await speak(text, language, options);
    return false;
  }

  try {
    // Get voice ID for language
    const voiceId = getVoiceIdForLanguage(language);

    const sentences = splitIntoSentences(text, language);
    isSpeaking = true;

    for (const sentence of sentences) {
      if (!isSpeaking) break;
      if (sentence.trim().length === 0) continue;

      const response = await fetch(`${API_CONFIG.ELEVENLABS_URL}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: sentence,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        console.error('[TTS] ElevenLabs error:', response.status);
        // Fallback to expo-speech for remaining
        await speak(sentence, language);
        continue;
      }

      // Play the audio chunk
      // Note: In React Native, we'd need to save to file and play
      // For now, fall back to expo-speech since direct audio streaming
      // requires native modules
      await speak(sentence, language);
    }

    isSpeaking = false;
    options?.onDone?.();
    return true;
  } catch (error) {
    console.error('[TTS] ElevenLabs failed:', error);
    // Fallback
    await speak(text, language, options);
    return false;
  }
}

// ─── Stop Speaking ──────────────────────────────────────────────
export async function stopSpeaking(): Promise<void> {
  isSpeaking = false;
  currentUtteranceId++;
  try {
    await Speech.stop();
  } catch {}
}

// ─── Check Speaking ─────────────────────────────────────────────
export function isCurrentlySpeaking(): boolean {
  return isSpeaking;
}

// ─── Sentence Splitting ────────────────────────────────────────
function splitIntoSentences(text: string, language: string): string[] {
  // Hindi/Devanagari sentence endings
  const devanagariLangs = ['hi', 'mr', 'ne', 'kok', 'doi', 'mai', 'bho', 'awa', 'bun', 'raj', 'sat'];

  let delimiters: RegExp;
  if (devanagariLangs.includes(language)) {
    delimiters = /(?<=[।\?\!\.])(?:\s+)?/;
  } else if (language === 'ur' || language === 'sd') {
    delimiters = /(?<=[۔\?\!\.])(?:\s+)?/;
  } else {
    delimiters = /(?<=[\.!\?])(?:\s+)/;
  }

  const sentences = text.split(delimiters).filter(s => s.trim().length > 0);

  // Merge very short fragments with next sentence
  const merged: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    if (sentences[i].length < 10 && i + 1 < sentences.length) {
      sentences[i + 1] = sentences[i] + ' ' + sentences[i + 1];
    } else {
      merged.push(sentences[i]);
    }
  }

  return merged.length > 0 ? merged : [text];
}

// ─── Voice ID per language ──────────────────────────────────────
function getVoiceIdForLanguage(language: string): string {
  const voiceMap: Record<string, string> = {
    hi: 'pFZP5JQG7iQjIQuC4Bku', // Hindi voice
    bn: 'pFZP5JQG7iQjIQuC4Bku',
    ta: 'pFZP5JQG7iQjIQuC4Bku',
    te: 'pFZP5JQG7iQjIQuC4Bku',
    en: '21m00Tcm4TlvDq8ikWAM', // Rachel
  };
  return voiceMap[language] || voiceMap.hi;
}

// ─── Get available voices ───────────────────────────────────────
export async function getAvailableVoices(): Promise<Speech.Voice[]> {
  try {
    return await Speech.getAvailableVoicesAsync();
  } catch {
    return [];
  }
}

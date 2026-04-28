// ═══════════════════════════════════════════════════════════════════
// VAANI STT Service — Groq Whisper (Cloud) + Local Fallback
// ═══════════════════════════════════════════════════════════════════

import * as FileSystem from 'expo-av';
import { API_CONFIG, VOICE_CONFIG, SUPPORTED_LANGUAGES } from '../constants';
import type { TranscriptionResult } from '../types';

// Hallucination patterns — common Whisper garbage outputs
const HALLUCINATION_PATTERNS = [
  /^(thank you|thanks|bye|okay)\.?$/i,
  /^(subscribe|like|share|comment)\.?$/i,
  /^(you|the|a|an|is|was|were)\s*$/i,
  /^\.+$/,
  /^\s*$/,
  /^(music|applause|laughter)$/i,
  /^\[.*\]$/, // [Music], [Applause] etc.
];

// ─── Transcribe via Groq Whisper ────────────────────────────────
export async function transcribeAudio(
  audioUri: string,
  languageHint?: string
): Promise<TranscriptionResult | null> {
  const apiKey = API_CONFIG.GROQ_API_KEY;

  if (!apiKey) {
    console.warn('[STT] No Groq API key, cannot transcribe');
    return null;
  }

  try {
    // Read audio file
    const formData = new FormData();

    // Get the file info
    const fileUri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;

    formData.append('file', {
      uri: fileUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);

    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('response_format', 'verbose_json');
    formData.append('temperature', '0.0');

    // Add language hint if provided
    if (languageHint) {
      const lang = SUPPORTED_LANGUAGES.find(l => l.code === languageHint);
      if (lang) {
        formData.append('language', lang.groqCode);
      }
    }

    const response = await fetch(API_CONFIG.GROQ_WHISPER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[STT] Groq API error:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    const text = (result.text || '').trim();
    const detectedLang = result.language || languageHint || 'hi';

    // Hallucination guard
    if (isHallucination(text)) {
      console.warn('[STT] Hallucination detected, rejecting:', text);
      return null;
    }

    return {
      text,
      language: mapGroqLanguage(detectedLang),
      confidence: result.segments?.[0]?.avg_logprob
        ? Math.exp(result.segments[0].avg_logprob)
        : 0.8,
      duration: result.duration || 0,
    };
  } catch (error) {
    console.error('[STT] Transcription failed:', error);
    return null;
  }
}

// ─── Hallucination Detection ────────────────────────────────────
function isHallucination(text: string): boolean {
  if (!text || text.length === 0) return true;

  // Too short (less than 3 characters is likely garbage)
  if (text.length <= VOICE_CONFIG.hallucination_max_length) return true;

  // Check against known hallucination patterns
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  // Repeated characters/words
  const words = text.split(/\s+/);
  if (words.length > 2 && new Set(words).size === 1) return true;

  return false;
}

// ─── Map Groq Language Code to VAANI Language Code ──────────────
function mapGroqLanguage(groqLang: string): string {
  const mapping: Record<string, string> = {
    'hindi': 'hi', 'hi': 'hi',
    'bengali': 'bn', 'bn': 'bn',
    'tamil': 'ta', 'ta': 'ta',
    'telugu': 'te', 'te': 'te',
    'marathi': 'mr', 'mr': 'mr',
    'gujarati': 'gu', 'gu': 'gu',
    'kannada': 'kn', 'kn': 'kn',
    'malayalam': 'ml', 'ml': 'ml',
    'punjabi': 'pa', 'pa': 'pa',
    'urdu': 'ur', 'ur': 'ur',
    'english': 'en', 'en': 'en',
    'nepali': 'ne', 'ne': 'ne',
    'assamese': 'as', 'as': 'as',
    'odia': 'or', 'or': 'or',
    'sindhi': 'sd', 'sd': 'sd',
  };
  return mapping[groqLang.toLowerCase()] || 'hi';
}

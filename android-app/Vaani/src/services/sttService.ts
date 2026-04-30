// ═══════════════════════════════════════════════════════════════════
// VAANI STT Service — Gemini Primary + Groq Whisper Failover
// Failover triggers on: 429 (rate limit) or 5xx (server error)
// ═══════════════════════════════════════════════════════════════════

import { API_CONFIG, VOICE_CONFIG, SUPPORTED_LANGUAGES } from '../constants';
import type { TranscriptionResult } from '../types';

// Hallucination patterns — common Whisper/Gemini garbage outputs
const HALLUCINATION_PATTERNS = [
  /^(thank you|thanks|bye|okay)\.?$/i,
  /^(subscribe|like|share|comment)\.?$/i,
  /^(you|the|a|an|is|was|were)\s*$/i,
  /^\.+$/,
  /^\s*$/,
  /^(music|applause|laughter)$/i,
  /^\[.*\]$/, // [Music], [Applause] etc.
];

// BCP-47 mapping for Gemini
const BCP47_MAP: Record<string, string> = {
  hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN', mr: 'mr-IN',
  gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN', or: 'or-IN',
  ur: 'ur-IN', en: 'en-IN', as: 'as-IN',
};

// ─── Primary: Gemini STT ────────────────────────────────────────
async function transcribeWithGemini(
  audioBase64: string,
  languageHint: string
): Promise<TranscriptionResult | null> {
  const apiKey = API_CONFIG.GEMINI_API_KEY;
  if (!apiKey) throw { status: 0, message: 'GEMINI_API_KEY not set' };

  const bcp47 = BCP47_MAP[languageHint] || 'hi-IN';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType: 'audio/m4a', data: audioBase64 } },
            { text: `Transcribe this audio accurately. The speaker is likely speaking an Indian language (${bcp47}). Return ONLY the transcribed text, nothing else. If the audio is silent or unclear, return an empty string.` }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) {
    const status = response.status;
    console.error(`[Gemini STT] Error ${status}`);
    throw { status, message: `Gemini STT failed: ${status}`, provider: 'gemini' };
  }

  const data = await response.json();
  const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
  console.log(`[Gemini STT] ✓ "${text.substring(0, 50)}..."`);

  if (isHallucination(text)) return null;

  return {
    text,
    language: languageHint || 'hi',
    confidence: 0.9,
    duration: 0,
  };
}

// ─── Failover: Groq Whisper STT ─────────────────────────────────
async function transcribeWithGroq(
  audioUri: string,
  languageHint: string
): Promise<TranscriptionResult | null> {
  const apiKey = API_CONFIG.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const formData = new FormData();
  const fileUri = audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`;

  formData.append('file', {
    uri: fileUri,
    type: 'audio/m4a',
    name: 'recording.m4a',
  } as any);

  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'verbose_json');
  formData.append('temperature', '0.0');

  if (languageHint) {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === languageHint);
    if (lang) formData.append('language', lang.groqCode);
  }

  const response = await fetch(API_CONFIG.GROQ_WHISPER_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    console.error(`[Groq STT] Error ${response.status}`);
    return null;
  }

  const result = await response.json();
  const text = (result.text || '').trim();
  console.log(`[Groq STT] ✓ "${text.substring(0, 50)}..."`);

  if (isHallucination(text)) return null;

  return {
    text,
    language: mapGroqLanguage(result.language || languageHint || 'hi'),
    confidence: result.segments?.[0]?.avg_logprob
      ? Math.exp(result.segments[0].avg_logprob) : 0.8,
    duration: result.duration || 0,
  };
}

// ─── Main Transcribe with Failover ──────────────────────────────
export async function transcribeAudio(
  audioUri: string,
  languageHint?: string
): Promise<TranscriptionResult | null> {
  const lang = languageHint || 'hi';

  // Try Gemini first (needs base64)
  if (API_CONFIG.GEMINI_API_KEY) {
    try {
      // Read file as base64 for Gemini
      const response = await fetch(audioUri.startsWith('file://') ? audioUri : `file://${audioUri}`);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || '');
        };
        reader.readAsDataURL(blob);
      });

      const result = await transcribeWithGemini(base64, lang);
      if (result) return result;
    } catch (geminiError: any) {
      const status = geminiError?.status || 500;
      console.warn(`[STT] Gemini failed (${status}), trying Groq...`);

      // Only failover on rate limit or server errors
      if (status !== 429 && status < 500) return null;
    }
  }

  // Failover to Groq Whisper
  if (API_CONFIG.GROQ_API_KEY) {
    try {
      return await transcribeWithGroq(audioUri, lang);
    } catch (groqError) {
      console.error('[STT] Both providers failed:', groqError);
    }
  }

  console.error('[STT] No working STT provider');
  return null;
}

// ─── Hallucination Detection ────────────────────────────────────
function isHallucination(text: string): boolean {
  if (!text || text.length === 0) return true;
  if (text.length <= VOICE_CONFIG.hallucination_max_length) return true;
  for (const pattern of HALLUCINATION_PATTERNS) {
    if (pattern.test(text)) return true;
  }
  const words = text.split(/\s+/);
  if (words.length > 2 && new Set(words).size === 1) return true;
  return false;
}

// ─── Map Groq Language Code ─────────────────────────────────────
function mapGroqLanguage(groqLang: string): string {
  const mapping: Record<string, string> = {
    'hindi': 'hi', 'hi': 'hi', 'bengali': 'bn', 'bn': 'bn',
    'tamil': 'ta', 'ta': 'ta', 'telugu': 'te', 'te': 'te',
    'marathi': 'mr', 'mr': 'mr', 'gujarati': 'gu', 'gu': 'gu',
    'kannada': 'kn', 'kn': 'kn', 'malayalam': 'ml', 'ml': 'ml',
    'punjabi': 'pa', 'pa': 'pa', 'urdu': 'ur', 'ur': 'ur',
    'english': 'en', 'en': 'en', 'assamese': 'as', 'as': 'as',
    'odia': 'or', 'or': 'or',
  };
  return mapping[groqLang.toLowerCase()] || 'hi';
}

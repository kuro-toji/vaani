import { franc } from 'franc-min';
import { languages } from '../data/languages.js';

// Build franc-to-code mapping (francCode -> code)
// franc uses ISO 639-3 codes, we need ISO 639-1 codes
const francToCode = {};
for (const lang of languages) {
  francToCode[lang.francCode] = lang.code;
}

export async function detectLanguage(text) {
  // Return 'hi' for empty or very short text
  if (!text || text.length < 2) {
    return 'hi';
  }

  // Clean the text - remove extra whitespace
  const cleaned = text.trim();

  // Check if it looks like Romanized Hindi (contains Hindi-specific patterns)
  const romanizedHindiPatterns = [
    /kya|kaisa|kaun|kyun|kaise|kaa/i,
    /hai|ho|hein|hain/i,
    /mai|mujhe|aap|tum|ham/i,
    /mera|hamara|apna/i,
    /woh|yeh|uska|iska/i,
    /kar|raha|rahi|henge/i,
    /sakta|shayad|lekin|toh/i,
    /acha|bura|accha|haan|nahin/i,
    /rupees|rupiya|lakh|crore/i,
    /paisa|peso|rupee/i,
    / FD | SIP |hisaab|khata/i,
    /panka|beej|mandi|gaon/i,
    /[\u0900-\u097F]/, // Hindi Devanagari script characters
  ];

  for (const pattern of romanizedHindiPatterns) {
    if (pattern.test(cleaned)) {
      return 'hi';
    }
  }

  // Fast path: check for common English words FIRST
  // This prevents franc-min from misdetecting short English as Somali/Hindi
  const englishPatterns = [
    /^(hi|hello|hey|yes|no|ok|okay|hmm|ah|oh|yo|sup|yo)$/i,
    /^(what|who|where|when|why|how|is|are|was|were|do|does|did|can|could|will|would|should|may|might)$/i,
    /^(i|me|my|we|us|our|you|your|he|she|it|they|them|their)$/i,
    /^[a-z][a-z\s]{0,30}$/i, // Short English sentences in Roman script
  ];

  const lowerText = cleaned.toLowerCase();
  const words = lowerText.split(/\s+/);

  // If most words are common English, return 'en' immediately
  const commonEnglishWords = new Set([
    'hi', 'hello', 'hey', 'yes', 'no', 'ok', 'okay', 'good', 'bad', 'nice', 'great',
    'please', 'thanks', 'thank', 'sorry', 'well', 'fine', 'sure', 'right',
    'what', 'who', 'where', 'when', 'why', 'how', 'which', 'whose', 'whom',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'done', 'doing', 'will', 'would', 'could', 'should',
    'can', 'may', 'might', 'must', 'shall',
    'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'yours', 'you', 'your',
    'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their',
    'this', 'that', 'these', 'those', 'here', 'there', 'with', 'without',
    'and', 'but', 'or', 'if', 'then', 'so', 'because', 'although', 'while',
    'in', 'on', 'at', 'to', 'for', 'from', 'by', 'of', 'about', 'into', 'over',
  ]);

  let englishWordCount = 0;
  for (const word of words) {
    const clean = word.replace(/[^a-z]/gi, '');
    if (englishPatterns.some(p => p.test(word)) || commonEnglishWords.has(clean)) {
      englishWordCount++;
    }
  }

  // If more than 60% words are English-ish, treat as English
  if (words.length >= 1 && englishWordCount / words.length > 0.5) {
    return 'en';
  }

  // Use franc for detection on cleaned text
  try {
    const francResult = franc(cleaned, { minLength: 3 });
    const code = francToCode[francResult];

    if (code) {
      // If franc detects 'eng' but text has Hindi Devanagari chars, return 'hi'
      if (code === 'en' && /[\u0900-\u097F]/.test(cleaned)) {
        return 'hi';
      }
      return code;
    }
  } catch (e) {
    // franc failed, fallback to Hindi in Indian context
  }

  // Default to Hindi for Indian context
  return 'hi';
}

export default detectLanguage;

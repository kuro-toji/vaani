/**
 * Language Detector — Pure frontend, zero backend calls.
 *
 * Detection order:
 * 1. Unicode script detection (non-Latin scripts → immediate return)
 * 2. Romanized Hindi pattern matching
 * 3. Romanized patterns for other Indian languages
 * 4. Fallback: 'hi'
 */

/* ─────────────────────────────────────────────
 * 1. Unicode Script Detection
 *
 * If the text contains characters from a specific Indian script,
 * we can identify the language immediately without pattern matching.
 * ───────────────────────────────────────────── */
function detectByScript(text) {
  // Assamese vs Bengali — both use Bengali script [\u0980-\u09FF]
  // Assamese-specific: ৰ (U+09F0) and ৱ (U+09F1)
  if (/[\u0980-\u09FF]/.test(text)) {
    if (/[\u09F0\u09F1]/.test(text)) return 'as'; // Assamese
    return 'bn'; // Bengali
  }

  // Telugu [\u0C00-\u0C7F]
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te';

  // Tamil [\u0B80-\u0BFF]
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';

  // Gujarati [\u0A80-\u0AFF]
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu';

  // Kannada [\u0C80-\u0CFF]
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';

  // Malayalam [\u0D00-\u0D7F]
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml';

  // Punjabi / Gurmukhi [\u0A00-\u0A7F]
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';

  // Odia [\u0B00-\u0B7F]
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or';

  // Arabic/Urdu [\u0600-\u06FF]
  // Urdu-specific chars: پ (U+067E) چ (U+0686) ژ (U+0698) ک (U+06A9) گ (U+06AF)
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'ur'; // Default to Urdu in Indian context
  }

  // Devanagari [\u0900-\u097F] — Hindi (or Marathi, but default to Hindi)
  if (/[\u0900-\u097F]/.test(text)) return 'hi';

  return null; // No script match — continue to romanized detection
}

/* ─────────────────────────────────────────────
 * 2. Romanized Hindi Patterns
 * ───────────────────────────────────────────── */
const ROMANIZED_HINDI_PATTERNS = [
  /\b(kya|kaisa|kaun|kyun|kaise|kaa)\b/i,
  /\b(hai|ho|hein|hain)\b/i,
  /\b(mai|mujhe|aap|tum|ham)\b/i,
  /\b(mera|meri|hamara|apna)\b/i,
  /\b(woh|yeh|uska|iska)\b/i,
  /\b(kar|raha|rahi|henge)\b/i,
  /\b(sakta|shayad|lekin|toh)\b/i,
  /\b(acha|bura|accha|haan|nahin)\b/i,
  /\b(rupees|rupiya|lakh|crore)\b/i,
  /\b(paisa|bachao|bachat|nivesh)\b/i,
  /\b(kitna|kab|kahan|kidhar)\b/i,
  /\b(chahiye|chahte|batao|bolo)\b/i,
];

/* ─────────────────────────────────────────────
 * 3. Romanized Patterns for Other Indian Languages
 * ───────────────────────────────────────────── */
const ROMANIZED_OTHER = [
  {
    code: 'ta',
    patterns: [/\b(naan|unakku|enna|eppo|vanakkam|yenna|romba|nandri|eppadi)\b/i],
  },
  {
    code: 'te',
    patterns: [/\b(nenu|meeru|emiti|ela|cheppandi|bagundi|dhanyavadam|edi)\b/i],
  },
  {
    code: 'bn',
    patterns: [/\b(ami|tumi|apni|kemon|acho|bhalo|dhonnobad|kothay)\b/i],
  },
  {
    code: 'kn',
    patterns: [/\b(nanu|nimma|enu|hegide|namaskaara|hege|yenu|beku)\b/i],
  },
  {
    code: 'ml',
    patterns: [/\b(njan|ningal|enthu|evide|salam|nanni|sugham|engane)\b/i],
  },
  {
    code: 'gu',
    patterns: [/\b(hoon|tame|shu|kem|chho|namaste|aabhar|kyaa)\b/i],
  },
  {
    code: 'mr',
    patterns: [/\b(mi|tumhi|kasa|aahe|namaskar|mala|kaay|kasa)\b/i],
  },
];

/* ═════════════════════════════════════════════
 * Main Detection Function
 * ═════════════════════════════════════════════ */

/**
 * Detect the language of a text string.
 * Runs entirely on the frontend — no network calls.
 *
 * @param {string} text - Input text to detect language for.
 * @returns {Promise<string>} ISO language code (e.g. 'hi', 'ta', 'bn').
 */
export async function detectLanguage(text) {
  if (!text || text.length < 2) {
    return 'hi';
  }

  // Step 1: Unicode script detection (fast, definitive)
  const scriptResult = detectByScript(text);
  if (scriptResult) return scriptResult;

  // Step 2: Romanized Hindi patterns
  for (const pattern of ROMANIZED_HINDI_PATTERNS) {
    if (pattern.test(text)) {
      return 'hi';
    }
  }

  // Step 3: Romanized patterns for other Indian languages
  for (const lang of ROMANIZED_OTHER) {
    for (const pattern of lang.patterns) {
      if (pattern.test(text)) {
        return lang.code;
      }
    }
  }

  // Step 4: If text is mostly ASCII with no Indian-language signals, check for English
  if (/^[a-zA-Z0-9\s.,!?'"()\-:;@#$%&*+=\/\\]+$/.test(text)) {
    return 'en';
  }

  // Final fallback
  return 'hi';
}

export default { detectLanguage };
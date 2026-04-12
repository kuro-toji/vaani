import { franc } from 'franc-min';
import { languages } from '../data/languages.js';

// Build franc-to-code mapping (francCode -> code)
// franc uses ISO 639-3 codes, we need ISO 639-1 codes
const francToCode = {};
for (const lang of languages) {
  francToCode[lang.francCode] = lang.code;
}

// Languages that franc might confuse with Indian languages
const ambiguousCodes = new Set(['urd', 'pan', 'ben', 'hin']);

export async function detectLanguage(text) {
  // Return 'hi' for empty or very short text
  if (!text || text.length < 2) {
    return 'hi';
  }

  // Fast path: check for common English words FIRST
  // This prevents franc-min from misdetecting short English as Somali/Hindi
  const englishPatterns = [
    /^(hi|hello|hey|yes|no|ok|okay|hmm|ah|oh|yo|sup|yo)$/i,
    /^(what|who|where|when|why|how|is|are|was|were|do|does|did|can|could|will|would|should|may|might)$/i,
    /^(i|me|my|we|us|our|you|your|he|she|it|they|them|their)$/i,
    /^(fd|sip|loan|emi|npa|roi|bank|card|pin|otp|kyc|pan)$/i,
    /^[a-z][a-z\s]{0,30}$/i, // Short English sentences in Roman script
  ];

  const lowerText = text.trim().toLowerCase();
  const words = lowerText.split(/\s+/);

  // If most words are common English, return 'en' immediately
  const commonEnglishWords = new Set([
    'hi', 'hello', 'hey', 'yes', 'no', 'ok', 'okay', 'good', 'bad', 'nice', 'great',
    'please', 'thanks', 'thank', 'sorry', 'well', 'fine', 'okay', 'sure', 'right',
    'what', 'who', 'where', 'when', 'why', 'how', 'which', 'whose', 'whom',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'done', 'doing', 'will', 'would', 'could', 'should',
    'can', 'may', 'might', 'must', 'shall',
    'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours',
    'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their',
    'this', 'that', 'these', 'those', 'here', 'there', 'with', 'without',
    'and', 'but', 'or', 'if', 'then', 'so', 'because', 'although', 'while',
    'in', 'on', 'at', 'to', 'for', 'from', 'by', 'of', 'about', 'into', 'over',
    'fd', 'sip', 'loan', 'emi', 'npa', 'roi', 'bank', 'card', 'pin', 'otp', 'kyc', 'pan',
    'account', 'balance', 'transfer', 'deposit', 'withdraw', 'rate', 'interest',
    'money', 'cash', 'ruppee', 'rupee', 'lakh', 'crore', 'thousand', 'hundred',
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

  try {
    // Detect language using franc
    const detected = franc(text, { minLength: 3 });
    
    // If franc returns 'und' (undefined) or an unmapped code, use Gemini fallback
    if (detected === 'und' || !francToCode[detected]) {
      return await geminiFallback(text);
    }

    const code = francToCode[detected];
    
    // If the mapped code is valid, return it
    if (code) {
      return code;
    }

    // Final fallback to Gemini
    return await geminiFallback(text);
  } catch (error) {
    console.error('Language detection error:', error);
    return await geminiFallback(text);
  }
}

async function geminiFallback(text) {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('VITE_GEMINI_API_KEY not set, defaulting to hi');
      return 'hi';
    }

    const prompt = `What language is this text written in? This is a personal finance assistant app. 
Common English words like "hi", "hello", "yes", "no", "what", "how", "I", "you", "FD", "SIP", "loan" in plain Roman English are ENGLISH, not Hindi.
If the text contains ONLY common Roman English words and numbers, reply with "en".
Otherwise reply with the appropriate Indian language code (hi, bn, te, ta, mr, ur, gu, kn, ml, pa, or, etc).
Reply with ONLY the ISO 639-1 two-letter language code, nothing else.
Text: "${text}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return 'hi';
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const languageCode = candidate?.content?.parts?.[0]?.text?.trim().toLowerCase();

    // Validate that the returned code is one of our supported codes
    const INDIAN_AND_COMMON_CODES = ['hi', 'bn', 'te', 'ta', 'mr', 'ur', 'gu', 'kn', 'ml', 'pa', 'or', 'ne', 'as', 'mai', 'sat', 'ks', 'sd', 'kok', 'dgo', 'brx', 'mni', 'sa', 'bho', 'raj', 'hne', 'tcy', 'bgc', 'mag', 'en', 'eng'];
    const isValidCode = INDIAN_AND_COMMON_CODES.includes(languageCode);
    
    if (isValidCode) {
      return languageCode;
    }

    return 'hi';
  } catch (error) {
    console.error('Gemini fallback error:', error);
    return 'hi';
  }
}

export default detectLanguage;

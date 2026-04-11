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
  if (!text || text.length < 3) {
    return 'hi';
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

    const prompt = `What Indian language is this text written in? Consider Hinglish and romanized Indian languages. Reply with ONLY the ISO 639-1 two-letter language code, nothing else. Text: "${text}"`;

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

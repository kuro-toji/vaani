// ═══════════════════════════════════════════════════════════════════
// VAANI 22 Languages + Dialect Support
// Groq Whisper mapping for speech recognition
// ═══════════════════════════════════════════════════════════════════

// ─── Language Definitions ────────────────────────────────────────────
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  speechCode: string;      // For STT
  ttsCode: string;         // For TTS
  groqModel: string;       // Whisper model variant
  isRTL: boolean;
  isSupported: boolean;
  region?: string;
}

// ─── 22 Languages Supported ─────────────────────────────────────────
export const LANGUAGES: Language[] = [
  // North India
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechCode: 'hi-IN', ttsCode: 'hi-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'North' },
  { code: 'en', name: 'English', nativeName: 'English', speechCode: 'en-IN', ttsCode: 'en-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'Universal' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechCode: 'pa-IN', ttsCode: 'pa-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'Punjab' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechCode: 'bn-IN', ttsCode: 'bn-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'East' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', speechCode: 'or-IN', ttsCode: 'or-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'East' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', speechCode: 'as-IN', ttsCode: 'as-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'Northeast' },
  
  // West India
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechCode: 'mr-IN', ttsCode: 'mr-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'West' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', speechCode: 'gu-IN', ttsCode: 'gu-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'West' },
  { code: 'raj', name: 'Rajasthani', nativeName: 'राजस्थानी', speechCode: 'raj-IN', ttsCode: 'hi-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'Rajasthan' },
  
  // South India
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechCode: 'ta-IN', ttsCode: 'ta-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'South' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechCode: 'te-IN', ttsCode: 'te-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'South' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechCode: 'kn-IN', ttsCode: 'kn-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'South' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechCode: 'ml-IN', ttsCode: 'ml-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'South' },
  
  // Central India
  { code: 'bho', name: 'Bhojpuri', nativeName: 'भोजपुरी', speechCode: 'bho-IN', ttsCode: 'hi-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'Bihar' },
  { code: 'maith', name: 'Maithili', nativeName: 'मैथिली', speechCode: 'mai-IN', ttsCode: 'hi-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'Bihar' },
  
  // Northeast
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলো', speechCode: 'mni-IN', ttsCode: 'en-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'Northeast' },
  { code: 'nd', name: 'Nepali', nativeName: 'नेपाली', speechCode: 'ne-IN', ttsCode: 'ne-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'Northeast' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', speechCode: 'kok-IN', ttsCode: 'kok-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'Goa' },
  
  // Additional
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', speechCode: 'sd-IN', ttsCode: 'sd-IN', groqModel: 'whisper-large-v3', isRTL: true, isSupported: true, region: 'Gujarat' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', speechCode: 'ur-IN', ttsCode: 'ur-IN', groqModel: 'whisper-large-v3', isRTL: true, isSupported: true, region: 'North' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', speechCode: 'sat-IN', ttsCode: 'or-IN', groqModel: 'whisper-large-v3', isRTL: false, isSupported: true, region: 'Jharkhand' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', speechCode: 'ks-IN', ttsCode: 'ks-IN', groqModel: 'whisper-large-v3', isRTL: true, isSupported: true, region: 'Kashmir' },
];

// ─── Dialect Mapping ──────────────────────────────────────────────────
export interface Dialect {
  id: string;
  code: string;
  name: string;
  parentLanguage: string;
  phrases: string[];      // Common dialect phrases
  translations: Record<string, string>;
}

export const DIALECTS: Dialect[] = [
  // Bhojpuri variants
  { id: 'bho_purbi', code: 'bho_purbi', name: 'Purbi Bhojpuri', parentLanguage: 'bho', phrases: ['हम', 'आव', 'के'], translations: { hi: 'मैं', 'hi': 'तू', 'hi': 'का' } },
  { id: 'bho_western', code: 'bho_western', name: 'Western Bhojpuri', parentLanguage: 'bho', phrases: ['हमरा', 'राउर', 'वाला'], translations: { hi: 'मेरा', 'hi': 'तुम्हारा', 'hi': 'वाला' } },
  
  // Rajasthani variants
  { id: 'raj_marwar', code: 'raj_marwar', name: 'Marwari', parentLanguage: 'raj', phrases: ['হাঁ', 'ना', 'লागो'], translations: { hi: 'हाँ', 'hi': 'नहीं', 'hi': 'लगा' } },
  { id: 'raj_shekhawati', code: 'raj_shekhawati', name: 'Shekhawati', parentLanguage: 'raj', phrases: ['মাই', 'তু', 'রে'], translations: { hi: 'मैं', 'hi': 'तू', 'hi': 'को' } },
  { id: 'raj_mewati', code: 'raj_mewati', name: 'Mewati', parentLanguage: 'raj', phrases: ['ম্যায়', 'তু', 'এই'], translations: { hi: 'मैं', 'hi': 'तू', 'hi': 'यह' } },
  
  // Tamil variants
  { id: 'ta_tamil', code: 'ta_tamil', name: 'Standard Tamil', parentLanguage: 'ta', phrases: ['நான்', 'நீ', 'அவர்'], translations: { en: 'I', 'en': 'you', 'en': 'he' } },
  { id: 'ta_kanitham', code: 'ta_kanitham', name: 'Coimbatore Tamil', parentLanguage: 'ta', phrases: ['நான்', 'ইত्थ', 'வந்தோம்'], translations: {} },
  
  // Telugu variants
  { id: 'te_andhra', code: 'te_andhra', name: 'Andhra Telugu', parentLanguage: 'te', phrases: ['నేను', 'మీరు', 'అతను'], translations: {} },
  { id: 'te_telangana', code: 'te_telangana', name: 'Telangana Telugu', parentLanguage: 'te', phrases: ['నేన్', 'మీరు', 'ఆయన'], translations: {} },
  
  // Punjabi variants
  { id: 'pa_eastern', code: 'pa_eastern', name: 'Eastern Punjabi', parentLanguage: 'pa', phrases: ['ਮੈਂ', 'ਤੂੰ', 'ਉਹ'], translations: {} },
  { id: 'pa_western', code: 'pa_western', name: 'Western Punjabi', parentLanguage: 'pa', phrases: ['آئین', 'توں', 'اوہ'], translations: {} },
  
  // Bengali variants
  { id: 'bn_standard', code: 'bn_standard', name: 'Standard Bengali', parentLanguage: 'bn', phrases: ['আমি', 'তুমি', 'সে'], translations: {} },
  { id: 'bn_sundarbans', code: 'bn_sundarbans', name: 'Sundarbans Bengali', parentLanguage: 'bn', phrases: ['মাই', 'তাই', 'সাই'], translations: {} },
  
  // Hindi variants
  { id: 'hi_standard', code: 'hi_standard', name: 'Standard Hindi', parentLanguage: 'hi', phrases: ['मैं', 'तू', 'वह'], translations: {} },
  { id: 'hi_awadhi', code: 'hi_awadhi', name: 'Awadhi', parentLanguage: 'hi', phrases: ['हम', 'तोहार', 'ओकर'], translations: {} },
  { id: 'hi_awadhi_f', code: 'hi_awadhi_f', name: 'Fiji Hindi', parentLanguage: 'hi', phrases: ['mi', 'tum', 'us'], translations: {} },
];

// ─── Groq Whisper Model Mapping ─────────────────────────────────────
export function getGroqModel(languageCode: string): string {
  // All languages use whisper-large-v3 for best accuracy
  // Groq supports 57 languages natively
  return 'whisper-large-v3';
}

// ─── Get Speech Code for STT ─────────────────────────────────────────
export function getSpeechCode(languageCode: string): string {
  const language = LANGUAGES.find(l => l.code === languageCode);
  return language?.speechCode || 'hi-IN';
}

// ─── Get TTS Code ─────────────────────────────────────────────────────
export function getTTSCode(languageCode: string): string {
  const language = LANGUAGES.find(l => l.code === languageCode);
  return language?.ttsCode || 'hi-IN';
}

// ─── Dialect Detection ────────────────────────────────────────────────
export function detectDialect(text: string, languageCode: string): Dialect | null {
  const normalizedText = text.toLowerCase();
  
  for (const dialect of DIALECTS) {
    if (dialect.parentLanguage !== languageCode) continue;
    
    // Check for dialect-specific phrases
    const matchCount = dialect.phrases.filter(phrase => 
      normalizedText.includes(phrase.toLowerCase())
    ).length;
    
    if (matchCount >= 2) {
      return dialect;
    }
  }
  
  return null;
}

// ─── Regional Language Detection by Pincode ─────────────────────────
const PINCODE_REGION_MAP: Record<string, string> = {
  // North India (Delhi, Haryana, Punjab, UP, etc.)
  '1': 'hi', '2': 'hi', '3': 'hi', '4': 'hi', '5': 'hi', '6': 'hi',
  // West India (Gujarat, Maharashtra, Rajasthan)
  '3': 'raj', '4': 'gu', '5': 'mr',
  // South India
  '5': 'ta', '6': 'te', '5': 'kn', '6': 'ml',
  // East India
  '7': 'bn', '8': 'or', '7': 'as',
};

export function detectRegionalLanguage(pincode: string): string {
  if (!pincode || pincode.length < 1) return 'hi';
  
  const firstDigit = pincode[0];
  return PINCODE_REGION_MAP[firstDigit] || 'hi';
}

// ─── Map Speech Code to Language ─────────────────────────────────────
export function mapSpeechCodeToLanguage(speechCode: string): Language | null {
  return LANGUAGES.find(l => l.speechCode === speechCode) || null;
}

// ─── Get Language by Code ─────────────────────────────────────────────
export function getLanguageByCode(code: string): Language | null {
  return LANGUAGES.find(l => l.code === code) || null;
}

// ─── Get All Supported Languages ─────────────────────────────────────
export function getSupportedLanguages(): Language[] {
  return LANGUAGES.filter(l => l.isSupported);
}

// ─── Get Languages by Region ─────────────────────────────────────────
export function getLanguagesByRegion(region: string): Language[] {
  return LANGUAGES.filter(l => l.region === region);
}

// ─── Digit Mapping for Indian Number System ─────────────────────────
export const DIGIT_MAP_INDIAN: Record<string, string> = {
  '0': 'शून्य', '1': 'एक', '2': 'दो', '3': 'तीन', '4': 'चार',
  '5': 'पाँच', '6': 'छह', '7': 'सात', '8': 'आठ', '9': 'नौ',
  // Spoken forms
  'ek': '1', 'do': '2', 'teen': '3', 'char': '4', 'paanch': '5',
  'che': '6', 'saat': '7', 'aath': '8', 'nau': '9', 'das': '10',
  // Lakh
  'lakh': '100000', 'lac': '100000',
  // Crore
  'crore': '10000000', 'cr': '10000000',
};

// ─── Parse Indian Number from Speech ────────────────────────────────
export function parseIndianNumber(text: string): number | null {
  const normalized = text.toLowerCase().trim();
  
  // Direct number match
  const directMatch = normalized.match(/[\d,]+/);
  if (directMatch) {
    return parseFloat(directMatch[0].replace(/,/g, ''));
  }
  
  // Indian word numbers
  let total = 0;
  let multiplier = 1;
  
  if (normalized.includes('crore') || normalized.includes('crore')) {
    const croreMatch = normalized.match(/(\d+)\s*crore/);
    if (croreMatch) total += parseInt(croreMatch[1]) * 10000000;
    multiplier *= 10000000;
  }
  
  if (normalized.includes('lakh') || normalized.includes('lac')) {
    const lakhMatch = normalized.match(/(\d+)\s*(?:lakh|lac)/);
    if (lakhMatch) total += parseInt(lakhMatch[1]) * 100000;
    multiplier = Math.max(multiplier, 100000);
  }
  
  if (normalized.includes('thousand') || normalized.includes('hazaar')) {
    const thousandMatch = normalized.match(/(\d+)\s*(?:thousand|hazaar)/);
    if (thousandMatch) total += parseInt(thousandMatch[1]) * 1000;
    multiplier = Math.max(multiplier, 1000);
  }
  
  // Digit words
  for (const [word, digit] of Object.entries(DIGIT_MAP_INDIAN)) {
    if (normalized.includes(word) && /^\d$/.test(digit)) {
      total = total * 10 + parseInt(digit);
    }
  }
  
  return total > 0 ? total : null;
}

// ─── Number to Hindi Words ───────────────────────────────────────────
export function numberToHindiWords(num: number): string {
  if (num === 0) return 'शून्य';
  
  const ones = ['', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ'];
  const tens = ['', '', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठ', 'सत्तर', 'अस्सी', 'नबे'];
  const thousands = ['', 'हज़ार', 'लाख', 'करोड़'];
  
  let result = '';
  let place = 0;
  
  while (num > 0) {
    if (place % 2 === 0) {
      const n = num % 100;
      if (n > 0) {
        const tensDigit = Math.floor(n / 10);
        const onesDigit = n % 10;
        result = (ones[tensDigit] ? ones[tensDigit] + ' ' : '') + tens[tensDigit] + ' ' + ones[onesDigit] + ' ' + result;
      }
    }
    num = Math.floor(num / 100);
    place++;
  }
  
  return result.trim();
}

// ─── Translation Helper ─────────────────────────────────────────────
export const COMMON_TRANSLATIONS: Record<string, Record<string, string>> = {
  // Greetings
  'namaste': { hi: 'नमस्ते', en: 'Hello', ta: 'வணக்கம்', te: 'నమస్కారం', bn: 'নমস্কার', mr: 'नमस्कार' },
  'dhanyavaad': { hi: 'धन्यवाद', en: 'Thank you', ta: 'நன்றி', te: 'ధన్యవాదాలు', bn: 'ধন্যবাদ', mr: 'धन्यवाद' },
  'kya haal hai': { hi: 'क्या हाल है', en: 'How are you', ta: 'எப்படி இருக்கிறீர்கள்', te: 'మీరు ఎలా ఉన్నారు', bn: 'কেমন আছো', mr: 'कसा आहे' },
  
  // Finance
  'kharcha': { hi: 'खर्चा', en: 'Expense', ta: 'செலவு', te: 'ఖర్చు', bn: 'খরচ', mr: 'खर्च' },
  'bachat': { hi: 'बचत', en: 'Savings', ta: 'சேமிப்பு', te: 'పొదుపు', bn: 'সঞ্চয়', mr: 'बचत' },
  'nivesh': { hi: 'निवेश', en: 'Investment', ta: 'முதலீடு', te: 'పెట్టుబడి', bn: 'বিনিয়োগ', mr: 'गुंतवणूक' },
  'kitna hai': { hi: 'कितना है', en: 'How much', ta: 'எவ்வளவு', te: 'ఎంత', bn: 'কতটা', mr: 'किती आहे' },
  
  // Common
  'hai': { hi: 'है', en: 'is', ta: 'உள்ளது', te: 'ఉంది', bn: 'আছে', mr: 'आहे' },
  'nahi': { hi: 'नहीं', en: 'No', ta: 'இல்லை', te: 'కాదు', bn: 'না', mr: 'नाही' },
  'haan': { hi: 'हाँ', en: 'Yes', ta: 'ஆம்', te: 'అవును', bn: 'হ্যাঁ', mr: 'होय' },
};

export function translate(text: string, fromLang: string, toLang: string): string {
  const translations = COMMON_TRANSLATIONS[text.toLowerCase()];
  if (translations && translations[toLang]) {
    return translations[toLang];
  }
  return text;
}

export default {
  LANGUAGES,
  DIALECTS,
  getGroqModel,
  getSpeechCode,
  getTTSCode,
  detectDialect,
  detectRegionalLanguage,
  mapSpeechCodeToLanguage,
  getLanguageByCode,
  getSupportedLanguages,
  getLanguagesByRegion,
  parseIndianNumber,
  numberToHindiWords,
  translate,
};
/**
 * Indian Digit Map — Maps spoken digit words and native numerals
 * from ALL major Indian languages to ASCII digits 0-9.
 *
 * Covers: Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada,
 * Malayalam, Odia, Punjabi (Gurmukhi), Urdu, Assamese, Nepali, Kashmiri
 *
 * Also maps English spoken words and common homophones.
 */

export const indianDigitMap = {
  // ── English ───────────────────────────────────────────────
  'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
  'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
  'to': '2', 'too': '2', 'for': '4', 'won': '1', 'ate': '8',

  // ── Hindi / Devanagari ────────────────────────────────────
  'शून्य': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
  'पांच': '5', 'पाँच': '5', 'छह': '6', 'छः': '6', 'सात': '7',
  'आठ': '8', 'नौ': '9',
  // Devanagari numerals
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',

  // ── Bengali / বাংলা ──────────────────────────────────────
  'শূন্য': '0', 'এক': '1', 'দুই': '2', 'তিন': '3', 'চার': '4',
  'পাঁচ': '5', 'ছয়': '6', 'সাত': '7', 'আট': '8', 'নয়': '9',
  // Bengali numerals
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',

  // ── Tamil / தமிழ் ────────────────────────────────────────
  'சுழியம்': '0', 'பூஜ்ஜியம்': '0', 'ஒன்று': '1', 'இரண்டு': '2',
  'மூன்று': '3', 'நான்கு': '4', 'ஐந்து': '5', 'ஆறு': '6',
  'ஏழு': '7', 'எட்டு': '8', 'ஒன்பது': '9',
  // Tamil numerals
  '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4',
  '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',

  // ── Telugu / తెలుగు ──────────────────────────────────────
  'సున్నా': '0', 'ఒకటి': '1', 'రెండు': '2', 'మూడు': '3',
  'నాలుగు': '4', 'ఐదు': '5', 'ఆరు': '6', 'ఏడు': '7',
  'ఎనిమిది': '8', 'తొమ్మిది': '9',
  // Telugu numerals
  '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4',
  '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',

  // ── Marathi (uses Devanagari script, different spoken words) ─
  'शुन्य': '0', 'एक्क': '1', 'दोन': '2', 'तीन्': '3', 
  'चार्': '4', 'पाच': '5', 'सहा': '6',
  'आठ्': '8', 'नऊ': '9',

  // ── Gujarati / ગુજરાતી ──────────────────────────────────
  'શૂન્ય': '0', 'એક': '1', 'બે': '2', 'ત્રણ': '3', 'ચાર': '4',
  'પાંચ': '5', 'છ': '6', 'સાત': '7', 'આઠ': '8', 'નવ': '9',
  // Gujarati numerals
  '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
  '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',

  // ── Kannada / ಕನ್ನಡ ──────────────────────────────────────
  'ಸೊನ್ನೆ': '0', 'ಒಂದು': '1', 'ಎರಡು': '2', 'ಮೂರು': '3',
  'ನಾಲ್ಕು': '4', 'ಐದು': '5', 'ಆರು': '6', 'ಏಳು': '7',
  'ಎಂಟು': '8', 'ಒಂಬತ್ತು': '9',
  // Kannada numerals
  '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4',
  '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',

  // ── Malayalam / മലയാളം ───────────────────────────────────
  'പൂജ്യം': '0', 'ഒന്ന്': '1', 'രണ്ട്': '2', 'മൂന്ന്': '3',
  'നാല്': '4', 'അഞ്ച്': '5', 'ആറ്': '6', 'ഏഴ്': '7',
  'എട്ട്': '8', 'ഒൻപത്': '9',
  // Malayalam numerals
  '൦': '0', '൧': '1', '൨': '2', '൩': '3', '൪': '4',
  '൫': '5', '൬': '6', '൭': '7', '൮': '8', '൯': '9',

  // ── Odia / ଓଡ଼ିଆ ────────────────────────────────────────
  'ଶୂନ': '0', 'ଏକ': '1', 'ଦୁଇ': '2', 'ତିନି': '3', 'ଚାରି': '4',
  'ପାଞ୍ଚ': '5', 'ଛଅ': '6', 'ସାତ': '7', 'ଆଠ': '8', 'ନଅ': '9',
  // Odia numerals
  '୦': '0', '୧': '1', '୨': '2', '୩': '3', '୪': '4',
  '୫': '5', '୬': '6', '୭': '7', '୮': '8', '୯': '9',

  // ── Punjabi / Gurmukhi ───────────────────────────────────
  'ਸਿਫ਼ਰ': '0', 'ਇੱਕ': '1', 'ਦੋ': '2', 'ਤਿੰਨ': '3', 'ਚਾਰ': '4',
  'ਪੰਜ': '5', 'ਛੇ': '6', 'ਸੱਤ': '7', 'ਅੱਠ': '8', 'ਨੌਂ': '9',
  // Gurmukhi numerals
  '੦': '0', '੧': '1', '੨': '2', '੩': '3', '੪': '4',
  '੫': '5', '੬': '6', '੭': '7', '੮': '8', '੯': '9',

  // ── Urdu / اردو (Eastern Arabic numerals) ────────────────
  'صفر': '0', 'ایک': '1', 'دو': '2', 'تین': '3', 'چار': '4',
  'پانچ': '5', 'چھ': '6', 'سات': '7', 'آٹھ': '8', 'نو': '9',
  // Eastern Arabic-Indic numerals used in Urdu
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',

  // ── Assamese / অসমীয়া ───────────────────────────────────
  'শূণ্য': '0', 'এক্': '1', 'দুই্': '2', 'তিনি': '3', 'চাৰি': '4',
  'পাঁচ্': '5', 'ছয়্': '6', 'সাত্': '7', 'আঠ': '8', 'ন': '9',
};

/**
 * Language code → Web Speech API BCP-47 locale mapping
 * Used for setting the speech recognition language dynamically.
 */
export const langToSpeechLocale = {
  'hi': 'hi-IN',
  'bn': 'bn-IN',
  'te': 'te-IN',
  'ta': 'ta-IN',
  'mr': 'mr-IN',
  'gu': 'gu-IN',
  'kn': 'kn-IN',
  'ml': 'ml-IN',
  'or': 'or-IN',  // Odia (may not be supported; fallback to en-IN)
  'pa': 'pa-IN',
  'ur': 'ur-IN',
  'as': 'as-IN',
  'en': 'en-IN',
  // Dialects that map to major language
  'bho': 'hi-IN',
  'raj': 'hi-IN',
  'hne': 'hi-IN',
  'bgc': 'hi-IN',
  'mag': 'hi-IN',
  'mai': 'hi-IN',
  'ne': 'ne-NP',
  'sa': 'hi-IN',
  'kok': 'hi-IN',
  'dgo': 'hi-IN',
  'brx': 'hi-IN',
  'mni': 'bn-IN',
  'ks': 'ur-IN',
  'sd': 'ur-IN',
  'sat': 'hi-IN',
  'tcy': 'kn-IN',
};

/**
 * Returns digit-map keys sorted by length descending, each tagged with
 * isAscii flag so callers can use the correct regex flag.
 */
export function getSortedDigitKeys() {
  return Object.keys(indianDigitMap)
    .sort((a, b) => b.length - a.length)
    .map(word => ({
      word,
      isAscii: /^[a-z]+$/i.test(word), // true only for pure ASCII (English digit words)
    }));
}

/**
 * Convert a text containing spoken digit words in any Indian language to ASCII digits.
 * @param {string} text - Raw transcript text
 * @returns {string} - String containing only extracted digit characters
 */
export function extractDigitsFromText(text) {
  if (!text) return '';

  const trimmed = text.trim();
  if (!trimmed) return '';

  // If transcript is already all digits (6 chars), return it directly
  const pureDigits = trimmed.replace(/\s/g, '').replace(/\D/g, '');
  if (pureDigits.length === 6) return pureDigits;

  const sortedKeys = getSortedDigitKeys();

  let result = trimmed;

  for (const { word, isAscii } of sortedKeys) {
    if (isAscii) {
      // ASCII words: case-insensitive replacement against lowercase version
      result = result.toLowerCase().replace(new RegExp(word, 'gi'), indianDigitMap[word]);
    } else {
      // Unicode words: match as-is, no case folding needed
      result = result.replace(new RegExp(word, 'g'), indianDigitMap[word]);
    }
  }

  // Extract only digit characters
  return result.replace(/\D/g, '');
}

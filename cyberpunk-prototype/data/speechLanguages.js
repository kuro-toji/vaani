// BCP-47 codes for Web Speech API
// Only these work reliably in Chrome's speech recognition
export const webSpeechSupported = {
  hi: 'hi-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  as: 'as-IN',
  ur: 'ur-IN',
  en: 'en-US',
}

// These will always fail in Web Speech API — route to Whisper
export const whisperOnly = [
  'mai', 'sat', 'ks', 'ne', 'sd',
  'kok', 'dgo', 'brx', 'mni', 'sa',
  'bho', 'raj', 'hne', 'tcy', 'bgc', 'mag'
]

// Whisper language codes (different from BCP-47)
export const whisperLangMap = {
  hi: 'hindi',
  bn: 'bengali',
  te: 'telugu',
  mr: 'marathi',
  ta: 'tamil',
  gu: 'gujarati',
  kn: 'kannada',
  ml: 'malayalam',
  pa: 'punjabi',
  or: 'odia',
  as: 'assamese',
  ur: 'urdu',
  mai: 'maithili',
  ne: 'nepali',
  ks: 'kashmiri',
  sd: 'sindhi',
  kok: 'konkani',
  sa: 'sanskrit',
  bho: 'hindi',
  raj: 'hindi',
  hne: 'hindi',
  tcy: 'kannada',
  bgc: 'hindi',
  mag: 'hindi',
  brx: 'hindi',
  mni: 'bengali',
  dgo: 'hindi',
  en: 'english',
}
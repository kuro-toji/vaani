// ═══════════════════════════════════════════════════════════════════
// VAANI 7-Step Voice Onboarding Service
// Fully accessible onboarding for specially abled users
// ═══════════════════════════════════════════════════════════════════

import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as Constants from '../constants';

// ─── Onboarding Step Types ───────────────────────────────────────────
export type OnboardingStep =
  | 'location'
  | 'language'
  | 'disability'
  | 'profile_config'
  | 'voice_calibration'
  | 'name_pin'
  | 'complete';

export interface OnboardingData {
  // Step 1: Location
  location?: {
    latitude: number;
    longitude: number;
    district?: string;
    state?: string;
    regionalLanguage?: string;
  };
  // Step 2: Language
  language?: string;
  // Step 3: Disability
  disability?: {
    visuallyImpaired: boolean;
    hearingImpaired: boolean;
    motorImpaired: boolean;
    illiterate: boolean;
  };
  // Step 4: Profile (auto-configured)
  profile?: {
    visualMode: 'normal' | 'large_text' | 'traffic_light';
    hapticEnabled: boolean;
    autoRead: boolean;
    screenAlwaysOn: boolean;
    largeButtons: boolean;
    iconsOnly: boolean;
  };
  // Step 5: Voice Calibration
  voiceCalibration?: {
    volumeThreshold: number;
    sensitivity: 'low' | 'medium' | 'high';
  };
  // Step 6: Name + PIN
  userName?: string;
  pin?: string;
}

// ─── Step Configuration ──────────────────────────────────────────────
export const ONBOARDING_STEPS: { id: OnboardingStep; title: string; titleHi: string; description: string; descriptionHi: string }[] = [
  { id: 'location', title: 'Location', titleHi: 'स्थान', description: 'Detecting your location...', descriptionHi: 'आपका स्थान पता कर रहे हैं...' },
  { id: 'language', title: 'Language', titleHi: 'भाषा', description: 'Select your language', descriptionHi: 'अपनी भाषा चुनें' },
  { id: 'disability', title: 'Accessibility', titleHi: 'पहुँच', description: 'Do you have any difficulty?', descriptionHi: 'क्या आपको कोई कठिनाई है?' },
  { id: 'profile_config', title: 'Setup', titleHi: 'सेटअप', description: 'Configuring your experience', descriptionHi: 'आपका अनुभव सेट कर रहे हैं' },
  { id: 'voice_calibration', title: 'Voice Setup', titleHi: 'आवाज़ सेटअप', description: 'Calibrate your voice', descriptionHi: 'अपनी आवाज़ कैलिब्रेट करें' },
  { id: 'name_pin', title: 'Profile', titleHi: 'प्रोफ़ाइल', description: 'Create your profile', descriptionHi: 'अपनी प्रोफ़ाइल बनाएं' },
  { id: 'complete', title: 'Done', titleHi: 'पूर्ण', description: 'Welcome!', descriptionHi: 'स्वागत है!' },
];

// ─── Language Options ────────────────────────────────────────────────
export const LANGUAGE_OPTIONS = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', voiceHint: '1' },
  { code: 'en', name: 'English', nativeName: 'English', voiceHint: '2' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', voiceHint: '3' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', voiceHint: '4' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', voiceHint: '5' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', voiceHint: '6' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', voiceHint: '7' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', voiceHint: '8' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', voiceHint: '9' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', voiceHint: '10' },
];

// ─── Disability Options ──────────────────────────────────────────────
export const DISABILITY_OPTIONS = [
  { id: 'visuallyImpaired', label: 'Blind/Vision impaired', labelHi: 'अंध/दृष्टि बाधित', voiceHint: '1' },
  { id: 'hearingImpaired', label: 'Cannot hear', labelHi: 'सुन नहीं सकते', voiceHint: '2' },
  { id: 'motorImpaired', label: 'Hand injury/Motor impaired', labelHi: 'हाथ की समस्या', voiceHint: '3' },
  { id: 'illiterate', label: 'Cannot read or write', labelHi: 'पढ़ना नहीं आता', voiceHint: '4' },
  { id: 'fullyAble', label: 'Fully able', labelHi: 'पूर्ण रूप से सक्षम', voiceHint: '5' },
];

// ─── Regional Language Detection ────────────────────────────────────
const REGIONAL_LANGUAGE_MAP: Record<string, string> = {
  // State to primary language
  'Rajasthan': 'raj',
  'Bihar': 'bho',
  'Uttar Pradesh': 'hi',
  'Madhya Pradesh': 'hi',
  'Maharashtra': 'mr',
  'Gujarat': 'gu',
  'West Bengal': 'bn',
  'Tamil Nadu': 'ta',
  'Karnataka': 'kn',
  'Kerala': 'ml',
  'Telangana': 'te',
  'Andhra Pradesh': 'te',
  'Punjab': 'pa',
  'Haryana': 'hi',
  'Delhi': 'hi',
  'Odisha': 'or',
  'Assam': 'as',
  'Nagaland': 'en',
  'Manipur': 'mni',
};

// ─── Step 1: Silent Location Detection ──────────────────────────────
export async function detectLocation(): Promise<{
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
  regionalLanguage?: string;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { latitude: 0, longitude: 0, regionalLanguage: 'hi' };
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    // Reverse geocode to get district/state
    const [geocoded] = await Location.reverseGeocodeAsync({ latitude, longitude });
    
    const state = geocoded.region || geocoded.subregion || '';
    const district = geocoded.district || '';
    const regionalLanguage = REGIONAL_LANGUAGE_MAP[state] || 'hi';

    return {
      latitude,
      longitude,
      district,
      state,
      regionalLanguage,
    };
  } catch (error) {
    console.warn('[Onboarding] Location error:', error);
    return { latitude: 0, longitude: 0, regionalLanguage: 'hi' };
  }
}

// ─── Step 2: Language Selection Audio Prompts ──────────────────────
export function getLanguageSelectionPrompt(regionalLanguage?: string): {
  hindi: string;
  english: string;
  regional: string;
} {
  const regionalName = regionalLanguage === 'mr' ? 'मराठी' 
    : regionalLanguage === 'gu' ? 'ગુજરાતી'
    : regionalLanguage === 'bn' ? 'বাংলা'
    : regionalLanguage === 'ta' ? 'தமிழ்'
    : regionalLanguage === 'te' ? 'తెలుగు'
    : regionalLanguage === 'kn' ? 'ಕನ್ನಡ'
    : regionalLanguage === 'ml' ? 'മലയാളം'
    : regionalLanguage === 'pa' ? 'ਪੰਜਾਬੀ'
    : 'हिन्दी';

  return {
    hindi: 'Namaste! Vaani mein aapka swagat hai. Kripya boliye: Hindi ke liye 1, English ke liye 2, ' + regionalName + ' ke liye 3.',
    english: 'Welcome to Vaani! Please say: 1 for Hindi, 2 for English, 3 for ' + (regionalLanguage || 'hi') + '.',
    regional: regionalLanguage === 'mr' ? 'नमस्कार! तुमचे स्वागत आहे. संख्या 1 हिंदीसाठी, 2 इंग्रजीसाठी, 3 मराठीसाठी बोला.'
      : regionalLanguage === 'gu' ? 'નમસ્તે! તમને સ્વાગત છે. 1 હિંદી માટે, 2 અંગ્રેજી માટે, 3 ગુજરાતી માટે કહો.'
      : regionalLanguage === 'bn' ? 'নমস্কার! আপনাকে স্বাগতম। ১ হিন্দির জন্য, ২ ইংরেজির জন্য, ৩ বাংলার জন্য বলুন।'
      : 'नमस्कार! आपका स्वागत है। 1 हिंदी के लिए, 2 अंग्रेजी के लिए, 3 ' + regionalName + ' के लिए बोलें।',
  };
}

// ─── Parse Language Selection ────────────────────────────────────────
export function parseLanguageSelection(text: string): string | null {
  const normalized = text.toLowerCase().trim();
  
  // Check for spoken numbers
  if (normalized.includes('ek') || normalized.includes('1') || normalized.includes('एक')) return 'hi';
  if (normalized.includes('do') || normalized.includes('2') || normalized.includes('two') || normalized.includes('दो')) return 'en';
  if (normalized.includes('teen') || normalized.includes('3') || normalized.includes('three') || normalized.includes('तीन')) return null; // regional
  
  // Direct language names
  if (normalized.includes('hindi') || normalized.includes('हिंदी')) return 'hi';
  if (normalized.includes('english')) return 'en';
  
  return null;
}

// ─── Step 3: Disability Detection Prompts ──────────────────────────
export function getDisabilityPrompt(language: string): string {
  if (language === 'hi') {
    return 'Kya aapko koi takaneeki hai? Bol sakte hain: 1 for andh ya drishti roadh, 2 for sunne ki samasya, 3 for haath ki takaneeki, 4 for padhna likhna nahi aata, 5 for bilkul samaarth. Kayi answers bol sakte hain.';
  }
  return 'Do you have any difficulty? Say 1 for blind/vision impaired, 2 for cannot hear, 3 for hand/motor impaired, 4 for illiterate, 5 for fully able. You can say multiple answers.';
}

// ─── Parse Disability Selection ─────────────────────────────────────
export function parseDisabilitySelection(text: string): Partial<{
  visuallyImpaired: boolean;
  hearingImpaired: boolean;
  motorImpaired: boolean;
  illiterate: boolean;
}> {
  const normalized = text.toLowerCase();
  const result: any = {
    visuallyImpaired: false,
    hearingImpaired: false,
    motorImpaired: false,
    illiterate: false,
  };

  // Check for spoken numbers
  if (normalized.includes('1') || normalized.includes('ek') || normalized.includes('एक')) result.visuallyImpaired = true;
  if (normalized.includes('2') || normalized.includes('do') || normalized.includes('दो')) result.hearingImpaired = true;
  if (normalized.includes('3') || normalized.includes('teen') || normalized.includes('तीन')) result.motorImpaired = true;
  if (normalized.includes('4') || normalized.includes('chaar') || normalized.includes('चार')) result.illiterate = true;
  if (normalized.includes('5') || normalized.includes('paanch') || normalized.includes('पाँच')) {
    // Fully able - all false
    return result;
  }

  // Check for keywords
  if (normalized.includes('blind') || normalized.includes('andh')) result.visuallyImpaired = true;
  if (normalized.includes('deaf') || normalized.includes('sun')) result.hearingImpaired = true;
  if (normalized.includes('hand') || normalized.includes('motor')) result.motorImpaired = true;
  if (normalized.includes('illiterate') || normalized.includes('padhna')) result.illiterate = true;

  return result;
}

// ─── Step 4: Profile Configuration ─────────────────────────────────
export function configureProfile(disability: {
  visuallyImpaired: boolean;
  hearingImpaired: boolean;
  motorImpaired: boolean;
  illiterate: boolean;
}): {
  visualMode: 'normal' | 'large_text' | 'traffic_light';
  hapticEnabled: boolean;
  autoRead: boolean;
  screenAlwaysOn: boolean;
  largeButtons: boolean;
  iconsOnly: boolean;
} {
  // Visually impaired: auto-read, haptic nav, screen always on
  if (disability.visuallyImpaired) {
    return {
      visualMode: 'normal',
      hapticEnabled: true,
      autoRead: true,
      screenAlwaysOn: true,
      largeButtons: false,
      iconsOnly: false,
    };
  }

  // Hearing impaired: large text, no auto-read, visual alerts
  if (disability.hearingImpaired) {
    return {
      visualMode: 'large_text',
      hapticEnabled: true,
      autoRead: false,
      screenAlwaysOn: false,
      largeButtons: false,
      iconsOnly: false,
    };
  }

  // Motor impaired: full screen tap, no small buttons, voice nav
  if (disability.motorImpaired) {
    return {
      visualMode: 'normal',
      hapticEnabled: true,
      autoRead: true,
      screenAlwaysOn: true,
      largeButtons: true,
      iconsOnly: false,
    };
  }

  // Illiterate: hide text inputs, icons only, auto-read everything
  if (disability.illiterate) {
    return {
      visualMode: 'normal',
      hapticEnabled: false,
      autoRead: true,
      screenAlwaysOn: false,
      largeButtons: false,
      iconsOnly: true,
    };
  }

  // Fully able: standard mode
  return {
    visualMode: 'normal',
    hapticEnabled: true,
    autoRead: false,
    screenAlwaysOn: false,
    largeButtons: false,
    iconsOnly: false,
  };
}

// ─── Step 5: Voice Calibration ─────────────────────────────────────
export async function calibrateVoice(): Promise<{
  volumeThreshold: number;
  sensitivity: 'low' | 'medium' | 'high';
}> {
  // In production, this would analyze recorded audio levels
  // For now, return default values
  return {
    volumeThreshold: -45, // dB threshold
    sensitivity: 'medium',
  };
}

export function getCalibrationPrompt(language: string): string {
  if (language === 'hi') {
    return 'Ab boliye "Namaste Vaani" apni normal awaaz mein. Main aapki awaaz sun kar sensitivity set karunga.';
  }
  return 'Please say "Namaste Vaani" at your normal volume. I will calibrate the microphone sensitivity for your voice.';
}

// ─── Step 6: Name + PIN ─────────────────────────────────────────────
export function getNamePrompt(language: string): string {
  if (language === 'hi') {
    return 'Ab aapka naam kya hai? Boliye.';
  }
  return 'What is your name? Please speak.';
}

export function getPinPrompt(language: string): string {
  if (language === 'hi') {
    return 'Ab 4 ankon ka PIN banaye. PIN boliye.';
  }
  return 'Now create a 4-digit PIN. Please speak your PIN.';
}

export function parsePin(text: string): string | null {
  // Extract 4 digits from text
  const digits = text.match(/\d{4}/);
  if (digits) return digits[0];
  
  // Parse spoken numbers
  const spokenDigits = text.match(/[0-9]/g);
  if (spokenDigits && spokenDigits.length === 4) {
    return spokenDigits.join('');
  }
  
  return null;
}

// ─── Step 7: Completion ─────────────────────────────────────────────
export function getCompletionMessage(name: string, language: string): string {
  if (language === 'hi') {
    return `Bahut badhiya ${name}! Aapka Vaani account ban gaya hai. Ab chat kholte hain!`;
  }
  return `Welcome ${name}! Your Vaani account is ready. Let me open the chat!`;
}

// ─── Provide Haptic Feedback ────────────────────────────────────────
export async function provideHapticFeedback(type: 'listening' | 'speaking' | 'success' | 'error'): Promise<void> {
  try {
    switch (type) {
      case 'listening':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'speaking':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {}
}

// ─── Text-to-Speech for Onboarding ──────────────────────────────────
export async function speak(text: string, language: string): Promise<void> {
  try {
    const voice = language === 'hi' ? 'hi-IN' : 'en-IN';
    await Speech.speak(text, {
      language: voice,
      rate: 0.9,
      pitch: 1.0,
    });
  } catch (error) {
    console.warn('[Onboarding] TTS error:', error);
  }
}

export default {
  ONBOARDING_STEPS,
  LANGUAGE_OPTIONS,
  DISABILITY_OPTIONS,
  detectLocation,
  getLanguageSelectionPrompt,
  parseLanguageSelection,
  getDisabilityPrompt,
  parseDisabilitySelection,
  configureProfile,
  calibrateVoice,
  getCalibrationPrompt,
  getNamePrompt,
  getPinPrompt,
  parsePin,
  getCompletionMessage,
  provideHapticFeedback,
  speak,
};

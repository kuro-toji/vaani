// ═══════════════════════════════════════════════════════════════════
// VAANI Voice Navigation Service
// Tap-anywhere voice overlay for blind/illiterate/specially abled
// Processes voice commands → navigates screens + speaks responses
// ═══════════════════════════════════════════════════════════════════

import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { API_CONFIG } from '../constants';

export type VoiceNavScreen =
  | 'Main' | 'Chat' | 'Settings' | 'AddExpense' | 'AddFD' | 'AddSIP'
  | 'TaxIntelligence' | 'CommandCenter' | 'SpendAwareness'
  | 'CreditIntelligence' | 'Freelancer' | 'Onboarding';

interface VoiceNavResult {
  screen?: VoiceNavScreen;
  action?: string;
  spoken: string;  // What VAANI says back
  language: string;
}

// ─── Navigation Command Patterns ────────────────────────────────
const NAV_PATTERNS: { patterns: RegExp[]; screen: VoiceNavScreen; response_hi: string; response_en: string }[] = [
  {
    patterns: [/होम|मुख्य|डैशबोर्ड|घर/i, /home|main|dashboard/i],
    screen: 'Main', response_hi: 'डैशबोर्ड खोल रही हूं', response_en: 'Opening dashboard',
  },
  {
    patterns: [/चैट|बात|सवाल|पूछ/i, /chat|talk|ask|question/i],
    screen: 'Chat', response_hi: 'चैट खोल रही हूं, पूछिए अपना सवाल', response_en: 'Opening chat, ask your question',
  },
  {
    patterns: [/सेटिंग|सेट|भाषा बदल/i, /setting|language|config/i],
    screen: 'Settings', response_hi: 'सेटिंग्स खोल रही हूं', response_en: 'Opening settings',
  },
  {
    patterns: [/खर्च|ख़र्चा|expense|कितना लगा/i, /expense|spending|add.*expense/i],
    screen: 'AddExpense', response_hi: 'खर्चा जोड़ रही हूं, बताइए कितना लगा', response_en: 'Adding expense, tell me the amount',
  },
  {
    patterns: [/एफडी|फिक्स्ड डिपॉजिट|जमा/i, /fd|fixed deposit/i],
    screen: 'AddFD', response_hi: 'FD सेक्शन खोल रही हूं', response_en: 'Opening FD section',
  },
  {
    patterns: [/सिप|एसआईपी|म्यूचुअल फंड/i, /sip|mutual fund/i],
    screen: 'AddSIP', response_hi: 'SIP सेक्शन खोल रही हूं', response_en: 'Opening SIP section',
  },
  {
    patterns: [/टैक्स|कर|इनकम टैक्स|tax/i, /tax|income tax/i],
    screen: 'TaxIntelligence', response_hi: 'टैक्स सलाह खोल रही हूं', response_en: 'Opening tax advisor',
  },
  {
    patterns: [/कमांड|फायर|रिटायर/i, /command|fire|retire/i],
    screen: 'CommandCenter', response_hi: 'कमांड सेंटर खोल रही हूं', response_en: 'Opening command center',
  },
  {
    patterns: [/खर्चा.*देख|कहां.*पैसा|spend.*aware/i, /spend|where.*money/i],
    screen: 'SpendAwareness', response_hi: 'खर्चा विश्लेषण खोल रही हूं', response_en: 'Opening spend analysis',
  },
  {
    patterns: [/क्रेडिट|लोन|कर्ज/i, /credit|loan|debt/i],
    screen: 'CreditIntelligence', response_hi: 'क्रेडिट विश्लेषण खोल रही हूं', response_en: 'Opening credit analysis',
  },
  {
    patterns: [/फ्रीलांस|गिग|बिल बना/i, /freelan|gig|invoice/i],
    screen: 'Freelancer', response_hi: 'फ्रीलांसर सेक्शन खोल रही हूं', response_en: 'Opening freelancer section',
  },
];

// ─── Action Patterns (non-navigation) ───────────────────────────
const ACTION_PATTERNS: { patterns: RegExp[]; action: string; response_hi: string; response_en: string }[] = [
  {
    patterns: [/कितना.*पैसा|बैलेंस|नेट वर्थ/i, /balance|net worth|how much/i],
    action: 'check_balance', response_hi: 'आपका बैलेंस बता रही हूं', response_en: 'Checking your balance',
  },
  {
    patterns: [/बिटकॉइन.*कितना|क्रिप्टो.*प्राइस|bitcoin.*price/i, /bitcoin.*price|crypto.*rate/i],
    action: 'check_crypto', response_hi: 'क्रिप्टो प्राइस चेक कर रही हूं', response_en: 'Checking crypto prices',
  },
  {
    patterns: [/एफडी.*रेट|बेस्ट.*एफडी|fd.*rate/i, /best.*fd|fd.*rate/i],
    action: 'check_fd', response_hi: 'सबसे अच्छी FD रेट बता रही हूं', response_en: 'Checking best FD rates',
  },
  {
    patterns: [/मदद|हेल्प|क्या.*कर.*सकत/i, /help|what.*can.*do/i],
    action: 'help', response_hi: 'मैं आपकी मदद कर सकती हूं। आप बोल सकते हैं - डैशबोर्ड खोलो, खर्चा जोड़ो, FD रेट बताओ, या कोई भी पैसों का सवाल पूछो।',
    response_en: 'I can help you. You can say - open dashboard, add expense, check FD rates, or ask any financial question.',
  },
];

// ─── Process Voice Command ──────────────────────────────────────
export function processVoiceCommand(text: string, language: string = 'hi'): VoiceNavResult {
  const trimmed = text.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) {
    return { spoken: language === 'en' ? 'Sorry, I didn\'t catch that. Please try again.' : 'माफ़ कीजिए, समझ नहीं आया। फिर से बोलिए।', language };
  }

  // Check navigation commands
  for (const nav of NAV_PATTERNS) {
    for (const pattern of nav.patterns) {
      if (pattern.test(trimmed)) {
        return {
          screen: nav.screen,
          spoken: language === 'en' ? nav.response_en : nav.response_hi,
          language,
        };
      }
    }
  }

  // Check action commands
  for (const act of ACTION_PATTERNS) {
    for (const pattern of act.patterns) {
      if (pattern.test(trimmed)) {
        return {
          action: act.action,
          spoken: language === 'en' ? act.response_en : act.response_hi,
          language,
        };
      }
    }
  }

  // Fallback — forward to chat
  return {
    screen: 'Chat',
    action: 'forward_to_chat',
    spoken: language === 'en' ? 'Let me look into that for you.' : 'मैं इसका जवाब ढूंढ रही हूं, चैट में ले जा रही हूं।',
    language,
  };
}

// ─── Speak Text (TTS) ───────────────────────────────────────────
const BCP47: Record<string, string> = {
  hi: 'hi-IN', en: 'en-IN', bn: 'bn-IN', te: 'te-IN', ta: 'ta-IN',
  mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN',
  or: 'or-IN', as: 'as-IN',
};

export function speak(text: string, language: string = 'hi'): void {
  Speech.stop();
  Speech.speak(text, {
    language: BCP47[language] || 'hi-IN',
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
  });
}

export function stopSpeaking(): void {
  Speech.stop();
}

// ─── Announce Screen (for accessibility) ─────────────────────────
const SCREEN_ANNOUNCEMENTS: Record<string, { hi: string; en: string }> = {
  Main: { hi: 'आप डैशबोर्ड पर हैं। आपका बैलेंस और मार्केट डेटा यहां है। कहीं भी टैप करके बोलिए।', en: 'You are on the dashboard. Your balance and market data are here. Tap anywhere to speak.' },
  Chat: { hi: 'चैट खुली है। अपना सवाल बोलिए या टाइप करिए।', en: 'Chat is open. Speak or type your question.' },
  Settings: { hi: 'सेटिंग्स पेज। भाषा, आवाज़, और प्रोफ़ाइल बदल सकते हैं।', en: 'Settings page. You can change language, voice, and profile.' },
  AddExpense: { hi: 'खर्चा जोड़ने का पेज। बोलिए कितना खर्चा हुआ।', en: 'Add expense page. Tell me the amount spent.' },
  AddFD: { hi: 'FD जोड़ने का पेज। बैंक और रकम बताइए।', en: 'Add FD page. Tell me the bank and amount.' },
  AddSIP: { hi: 'SIP जोड़ने का पेज। फंड और रकम बताइए।', en: 'Add SIP page. Tell me the fund and amount.' },
  TaxIntelligence: { hi: 'टैक्स सलाह पेज। आपकी इनकम पर टैक्स गणना यहां है।', en: 'Tax advisor page. Tax calculation on your income is here.' },
  CommandCenter: { hi: 'कमांड सेंटर। FIRE नंबर और रिटायरमेंट प्लानिंग।', en: 'Command center. FIRE number and retirement planning.' },
};

export function announceScreen(screenName: string, language: string = 'hi'): void {
  const announcement = SCREEN_ANNOUNCEMENTS[screenName];
  if (announcement) {
    const text = language === 'en' ? announcement.en : announcement.hi;
    speak(text, language);
  }
}

// ─── Haptic Feedback ────────────────────────────────────────────
export function tapFeedback(): void {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

export function successFeedback(): void {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
}

export function errorFeedback(): void {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
}

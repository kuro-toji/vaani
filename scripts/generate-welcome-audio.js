#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// VAANI — One-time ElevenLabs Welcome Audio Generator
// Generates welcome audio in 13 Indian languages, saves as static MP3
// Run once: node scripts/generate-welcome-audio.js
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'welcome');

const ELEVENLABS_KEY = process.env.ELEVENLABS_API_KEY || 'sk_ae58da975b22c6ac45470becd27cfe5d31562ca8eb68100d';
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - warm, natural multilingual voice

const WELCOME_TEXTS = {
  hi: {
    text: 'नमस्ते! वाणी में आपका स्वागत है। मैं आपकी निजी वित्तीय सलाहकार हूं। बचत, निवेश, टैक्स — सब कुछ आपकी अपनी भाषा में। आइए शुरू करते हैं!',
    name: 'Hindi',
  },
  en: {
    text: 'Welcome to VAANI! I am your personal financial advisor. Savings, investments, taxes — everything in your own language. Let us get started!',
    name: 'English',
  },
  bn: {
    text: 'নমস্কার! VAANI-তে আপনাকে স্বাগতম। আমি আপনার ব্যক্তিগত আর্থিক উপদেষ্টা। সঞ্চয়, বিনিয়োগ, কর — সবকিছু আপনার নিজের ভাষায়।',
    name: 'Bengali',
  },
  te: {
    text: 'నమస్కారం! VAANI కి స్వాగతం. నేను మీ వ్యక్తిగత ఆర్థిక సలహాదారిని. పొదుపు, పెట్టుబడులు, పన్నులు — అన్నీ మీ భాషలో.',
    name: 'Telugu',
  },
  ta: {
    text: 'வணக்கம்! VAANI க்கு வரவேற்கிறோம். நான் உங்கள் தனிப்பட்ட நிதி ஆலோசகர். சேமிப்பு, முதலீடு, வரி — அனைத்தும் உங்கள் மொழியில்.',
    name: 'Tamil',
  },
  mr: {
    text: 'नमस्कार! VAANI मध्ये आपले स्वागत आहे. मी तुमचा वैयक्तिक आर्थिक सल्लागार आहे. बचत, गुंतवणूक, कर — सगळं तुमच्या भाषेत.',
    name: 'Marathi',
  },
  gu: {
    text: 'નમસ્કાર! VAANI માં આપનું સ્વાગત છે. હું તમારો વ્યક્તિગત નાણાકીય સલાહકાર છું. બચત, રોકાણ, કર — બધું તમારી ભાષામાં.',
    name: 'Gujarati',
  },
  kn: {
    text: 'ನಮಸ್ಕಾರ! VAANI ಗೆ ಸ್ವಾಗತ. ನಾನು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಆರ್ಥಿಕ ಸಲಹೆಗಾರ. ಉಳಿತಾಯ, ಹೂಡಿಕೆ, ತೆರಿಗೆ — ಎಲ್ಲವೂ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ.',
    name: 'Kannada',
  },
  ml: {
    text: 'നമസ്കാരം! VAANI ലേക്ക് സ്വാഗതം. ഞാൻ നിങ്ങളുടെ സ്വകാര്യ സാമ്പത്തിക ഉപദേഷ്ടാവാണ്. സേവിങ്സ്, നിക്ഷേപം, നികുതി — എല്ലാം നിങ്ങളുടെ ഭാഷയിൽ.',
    name: 'Malayalam',
  },
  pa: {
    text: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! VAANI ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਮੈਂ ਤੁਹਾਡਾ ਨਿੱਜੀ ਵਿੱਤੀ ਸਲਾਹਕਾਰ ਹਾਂ। ਬੱਚਤ, ਨਿਵੇਸ਼, ਟੈਕਸ — ਸਭ ਤੁਹਾਡੀ ਭਾਸ਼ਾ ਵਿੱਚ।',
    name: 'Punjabi',
  },
  or: {
    text: 'ନମସ୍କାର! VAANI ରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ। ମୁଁ ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ଆର୍ଥିକ ପରାମର୍ଶଦାତା। ସଞ୍ଚୟ, ନିବେଶ, କର — ସବୁ ଆପଣଙ୍କ ଭାଷାରେ।',
    name: 'Odia',
  },
  as: {
    text: 'নমস্কাৰ! VAANI লৈ আপোনাক স্বাগতম। মই আপোনাৰ ব্যক্তিগত বিত্তীয় উপদেষ্টা। সঞ্চয়, বিনিয়োগ, কৰ — সকলো আপোনাৰ ভাষাত।',
    name: 'Assamese',
  },
  bho: {
    text: 'प्रणाम! वाणी में रउआ के स्वागत बा। हम रउआ के निजी पइसा सलाहकार बानी। बचत, निवेश, टैक्स — सब कुछ रउआ अपना भाषा में। चलीं शुरू करीं!',
    name: 'Bhojpuri',
  },
};

async function generateAudio(langCode, { text, name }) {
  const outPath = path.join(OUTPUT_DIR, `welcome_${langCode}.mp3`);

  // Skip if already exists
  if (fs.existsSync(outPath)) {
    console.log(`  ✓ ${name} (${langCode}) — already exists, skipping`);
    return true;
  }

  console.log(`  ⏳ Generating ${name} (${langCode})...`);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error(`  ✗ ${name} failed: ${response.status} — ${err}`);
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
    const sizeKB = (buffer.byteLength / 1024).toFixed(1);
    console.log(`  ✓ ${name} (${langCode}) — ${sizeKB}KB saved`);

    // Rate limit: wait 1s between requests
    await new Promise(r => setTimeout(r, 1200));
    return true;
  } catch (err) {
    console.error(`  ✗ ${name} error:`, err.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('VAANI Welcome Audio Generator');
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Languages: ${Object.keys(WELCOME_TEXTS).length}`);
  console.log('═══════════════════════════════════════════\n');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let success = 0;
  let failed = 0;

  for (const [code, data] of Object.entries(WELCOME_TEXTS)) {
    const ok = await generateAudio(code, data);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n═══════════════════════════════════════════`);
  console.log(`Done! ${success} generated, ${failed} failed`);
  console.log(`Files: ${OUTPUT_DIR}/welcome_*.mp3`);
  console.log('═══════════════════════════════════════════');

  // Generate manifest
  const manifest = {};
  for (const [code, data] of Object.entries(WELCOME_TEXTS)) {
    const filePath = path.join(OUTPUT_DIR, `welcome_${code}.mp3`);
    manifest[code] = {
      name: data.name,
      file: `/audio/welcome/welcome_${code}.mp3`,
      text: data.text,
      exists: fs.existsSync(filePath),
      size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0,
    };
  }
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('Manifest written to manifest.json');
}

main().catch(console.error);

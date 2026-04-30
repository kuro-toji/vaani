#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════
// VAANI — Onboarding Voice Prompts Generator
// Pre-generates ALL onboarding audio (location, language, accessibility)
// Run once: node scripts/generate-onboarding-audio.js
// ═══════════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'audio', 'onboarding');

const ELEVENLABS_KEY = 'sk_ae58da975b22c6ac45470becd27cfe5d31562ca8eb68100d';
const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

// All onboarding prompts in Hindi + English (the two universal languages)
const PROMPTS = {
  // ─── Step 1: Location Detection ───
  'location_detected_hi': {
    text: 'नमस्ते! मैंने आपकी लोकेशन पता लगाई है। क्या आप यहीं से हैं? अगर हां तो बोलिए "हां", वरना "नहीं" बोलिए।',
    desc: 'Location detected - Hindi',
  },
  'location_detected_en': {
    text: 'Hello! I have detected your location. Are you from this place? Say "Yes" to confirm, or "No" to change.',
    desc: 'Location detected - English',
  },

  // ─── Step 2: Language Choice ───
  'choose_language_hi': {
    text: 'अब बताइए, आप किस भाषा में बात करना चाहते हैं? आप स्क्रीन से भाषा चुन सकते हैं, या बस अपनी भाषा में कुछ बोलिए — मैं समझ जाऊंगी!',
    desc: 'Choose language - Hindi',
  },
  'choose_language_en': {
    text: 'Now tell me, which language would you like to speak in? You can pick from the screen, or just speak in your language — I will understand!',
    desc: 'Choose language - English',
  },

  // ─── Step 3: Mic Permission ───
  'mic_permission_hi': {
    text: 'VAANI को आपकी आवाज़ सुनने के लिए माइक्रोफ़ोन की ज़रूरत है। कृपया माइक एक्सेस दीजिए।',
    desc: 'Mic permission - Hindi',
  },
  'mic_permission_en': {
    text: 'VAANI needs microphone access to hear your voice. Please allow microphone access.',
    desc: 'Mic permission - English',
  },

  // ─── Step 4: Accessibility ───
  'accessibility_hi': {
    text: 'अब मुझे बताइए, क्या आपको कोई खास मदद चाहिए? क्या आपकी आंखें कमज़ोर हैं, सुनने में दिक्कत है, या आपको बड़े अक्षरों में दिखाना है? बस बोलिए या स्क्रीन से चुनिए।',
    desc: 'Accessibility question - Hindi',
  },
  'accessibility_en': {
    text: 'Now tell me, do you need any special assistance? Do you have difficulty seeing, hearing, or reading? Just speak or choose from the screen.',
    desc: 'Accessibility question - English',
  },

  // ─── Step 5: Setup Complete ───
  'setup_complete_hi': {
    text: 'बहुत बढ़िया! आपकी सेटिंग्स सेव हो गई हैं। अब VAANI आपकी अपनी भाषा में, आपके तरीके से काम करेगी। चलिए शुरू करते हैं!',
    desc: 'Setup complete - Hindi',
  },
  'setup_complete_en': {
    text: 'Excellent! Your settings are saved. VAANI will now work in your language, your way. Let us get started!',
    desc: 'Setup complete - English',
  },

  // ─── Accessibility Options (voice labels) ───
  'option_visual_hi': {
    text: 'आंखें कमज़ोर हैं — बड़े अक्षर और आवाज़ से चलाएंगे',
    desc: 'Visual impairment option - Hindi',
  },
  'option_hearing_hi': {
    text: 'सुनने में दिक्कत — बड़े टेक्स्ट और कंपन से बताएंगे',
    desc: 'Hearing impairment option - Hindi',
  },
  'option_illiterate_hi': {
    text: 'पढ़ना मुश्किल है — चिंता मत करो, सब कुछ आवाज़ से होगा',
    desc: 'Illiterate option - Hindi',
  },
  'option_none_hi': {
    text: 'कोई ज़रूरत नहीं — सामान्य मोड में चलते हैं',
    desc: 'No accessibility needed - Hindi',
  },
};

async function generateAudio(key, { text, desc }) {
  const outPath = path.join(OUTPUT_DIR, `${key}.mp3`);

  if (fs.existsSync(outPath)) {
    console.log(`  ✓ ${desc} — already exists, skipping`);
    return true;
  }

  console.log(`  ⏳ ${desc}...`);

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
          voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error(`  ✗ ${desc} failed: ${response.status} — ${err}`);
      return false;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
    console.log(`  ✓ ${desc} — ${(buffer.byteLength / 1024).toFixed(1)}KB`);
    await new Promise(r => setTimeout(r, 1200));
    return true;
  } catch (err) {
    console.error(`  ✗ ${desc} error:`, err.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('VAANI Onboarding Audio Generator');
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Prompts: ${Object.keys(PROMPTS).length}`);
  console.log('═══════════════════════════════════════════\n');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let success = 0, failed = 0;
  for (const [key, data] of Object.entries(PROMPTS)) {
    const ok = await generateAudio(key, data);
    if (ok) success++; else failed++;
  }

  console.log(`\nDone! ${success} generated, ${failed} failed`);

  // Write manifest
  const manifest = {};
  for (const [key, data] of Object.entries(PROMPTS)) {
    manifest[key] = {
      file: `/audio/onboarding/${key}.mp3`,
      text: data.text,
      desc: data.desc,
      exists: fs.existsSync(path.join(OUTPUT_DIR, `${key}.mp3`)),
    };
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('Manifest written.');
}

main().catch(console.error);

# Bhashini Integration for Vaani — Product Document

## 1. Executive Summary

**Vaani** is a voice-enabled conversational AI assistant designed to provide accessible human-computer interaction through natural spoken language. Currently, Vaani leverages the Web Speech API for speech-to-text (STT) and browser-native text-to-speech (TTS) for audio output. However, these browser-based solutions suffer from significant limitations when handling India's linguistic diversity.

**Bhashini** is a Government of India initiative under MeitY that provides AI-powered language translation and speech services across 22+ Indian languages. By integrating Bhashini services, Vaani can offer:

- **Superior STT accuracy** for Indian languages compared to Web Speech API
- **Natural-sounding TTS** in multiple Indian languages
- **Cross-language translation** for Indic-to-Indic communication
- **Cross-browser reliability** (works on Brave, Firefox where Web Speech API is limited)

This integration positions Vaani as a truly inclusive voice assistant that understands and speaks India's languages natively.

---

## 2. About Bhashini

### 2.1 What is Bhashini?

Bhashini (भाषini — "Language Daughter") is a National Language Translation Mission launched by the Ministry of Electronics & Information Technology (MeitY), Government of India. The initiative aims to democratize access to digital services by breaking language barriers across India's 22 scheduled languages.

**Key Objectives:**
- Enable Indian citizens to access digital services in their native language
- Promote digital inclusion for non-English and non-Hindi speakers
- Preserve and promote Indian languages in the digital ecosystem
- Create a thriving AI ecosystem for Indian languages

### 2.2 Why Bhashini Was Created

India's linguistic diversity is vast — over 19,500 languages/dialects are spoken across the country. However, the digital world remains predominantly English-centric, creating a significant barrier for billions of Indians who are more comfortable in their native languages.

Bhashini addresses this by providing:
- **Accessibility**: Content in regional languages that would otherwise be inaccessible
- **Equity**: Equal opportunity to participate in the digital economy
- **Empowerment**: Citizens can interact with government services, banking, healthcare, and education in their preferred language

### 2.3 Who Powers Bhashini

Bhashini is a collaborative effort involving premier Indian institutions:

| Institution | Contribution |
|-------------|--------------|
| **AI4Bharat** (IIT Madras) | AI models, datasets, IndicTrans translation |
| **IIT Bombay** | Speech recognition, language processing |
| **IIT Madras** | Multilingual AI research |
| **CDAC** | Language computing tools, infrastructure |
| **MeitY** | Policy, funding, coordination |

### 2.4 ULCA Platform

**ULCA** (Unified Language Cloud API) is the public API platform for Bhashini services. It provides a unified interface to access various language AI models and pipelines through a single API gateway.

**Key Features:**
- Pre-built pipelines combining ASR, Translation, and TTS
- Pay-per-use pricing with free tier for development
- Support for 22+ Indian languages
- High-availability cloud infrastructure

---

## 3. Bhashini Services for Vaani

### 3.1 Speech-to-Text (ASR/STT)

**What it does:** Converts spoken language into written text in real-time.

**Supported Languages (22+):**
| Language | ISO Code | Status |
|----------|----------|--------|
| Hindi | hi | ✅ Full |
| English | en | ✅ Full |
| Bengali | bn | ✅ Full |
| Tamil | ta | ✅ Full |
| Telugu | te | ✅ Full |
| Marathi | mr | ✅ Full |
| Gujarati | gu | ✅ Full |
| Kannada | kn | ✅ Full |
| Malayalam | ml | ✅ Full |
| Punjabi | pa | ✅ Full |
| Odia | or | ✅ Full |
| Assamese | as | ✅ Full |
| Urdu | ur | ✅ Full |
| Nepali | ne | ✅ Full |
| Sanskrit | sa | ✅ Full |
| Manipuri | mni | ✅ Full |
| Konkani | kok | ✅ Full |
| Khasi | kha | ✅ Full |
| Mizo | lus | ✅ Full |
| Bodo | brx | ✅ Full |
| Dogri | doi | ✅ Full |
| Maithili | mai | ✅ Full |
| Santali | sat | ✅ Full |

**Why Better Than Web Speech API for Indian Languages:**

| Aspect | Web Speech API | Bhashini ASR |
|--------|----------------|--------------|
| Indian language support | Limited (hi, ta, te only) | 22+ languages |
| Accuracy on regional languages | Poor | High (AI4Bharat models) |
| Firefox/Brave support | Blocked/limited | Works universally |
| Customization | None | Domain-specific models |
| Privacy | Sends data to browser vendors | On-premise option available |

### 3.2 Neural Machine Translation (NMT)

**What it does:** Translates text between any two supported languages.

**Capabilities:**
- **Indic-to-English**: Access English content from regional languages
- **English-to-Indic**: Translate global content to Indian languages
- **Indic-to-Indic**: Cross-lingual communication between Indian languages (via AI4Bharat's IndicTrans)

**Use Cases for Vaani:**
- Preprocessing: If Gemini doesn't support a user's language, translate to Hindi/English first
- Response translation: Translate Gemini's response back to user's language
- Cross-language chat: Two users speaking different languages communicate via translation

### 3.3 Text-to-Speech (TTS)

**What it does:** Converts written text into natural-sounding speech.

**Supported Languages:** Same 22+ languages as ASR

**Voice Options:**
- Multiple voice models per language (male/female variants)
- Neural voices with natural prosody
- Adjustable speed and pitch (where supported)

**Why Better Than Browser TTS:**

| Aspect | Browser TTS | Bhashini TTS |
|--------|-------------|--------------|
| Indian language voices | Very limited | 22+ native voices |
| Voice quality | Robotic, synthetic | Neural, natural |
| Prosody | Flat, unnatural | Context-aware intonation |
| Consistency | Varies by browser/OS | Uniform quality |
| Customization | None | Voice selection per language |

---

## 4. Bhashini API Reference

### 4.1 API Endpoints

#### Pipeline Config (Get available models)
```
POST https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline
```

#### Pipeline Compute (Run inference pipeline)
```
POST https://dhruva-api.bhashini.gov.in/services/inference/pipeline
```

#### Direct TTS Endpoint
```
POST https://tts.bhashini.ai/v1/synthesize
```

#### Direct ASR Endpoint
```
POST https://asr.bhashini.ai/v1/asr
```

### 4.2 Authentication

**ULCA API (Pipeline):**
```javascript
Headers: {
  "Content-Type": "application/json",
  "userID": "YOUR_USER_ID",
  "ulcaApiKey": "YOUR_ULCA_API_KEY"
}
```

**Direct Endpoints (TTS/ASR):**
```javascript
Headers: {
  "Content-Type": "application/json",
  "X-API-KEY": "YOUR_X_API_KEY"
}
```

### 4.3 Pipeline IDs

| Pipeline Name | Pipeline ID | Purpose |
|--------------|-------------|---------|
| MeitY Default Pipeline | `64392f96daac500b55c543cd` | General purpose ASR+TTS |
| AI4Bharat Pipeline | `643930aa521a4b1ba0f4c41d` | AI4Bharat models (better quality) |

### 4.4 Request/Response Formats

#### ASR Request/Response

```javascript
// ASR Request
const asrRequest = {
  pipelineId: "643930aa521a4b1ba0f4c41d",
  input: [
    {
      source: "audio-base64-string",
      audioContentType: "audio/wav"
    }
  ],
  config: {
    language: {
      sourceLanguage: "ta"  // Tamil
    }
  }
};

// ASR Response
{
  "pipelineResponse": [
    {
      "output": [
        {
          "sourceText": "நம்ம வீட்டுல ஒரு பூனை இருக்கு"
        }
      ]
    }
  ]
}
```

#### TTS Request/Response

```javascript
// TTS Request
const ttsRequest = {
  pipelineId: "643930aa521a4b1ba0f4c41d",
  input: [
    {
      source: "நம்ம வீட்டுல ஒரு பூனை இருக்கு"
    }
  ],
  config: {
    language: {
      targetLanguage: "ta"
    },
    audioFormat: "wav",
    rate: 1.0,
    pitch: 1.0
  }
};

// TTS Response
{
  "pipelineResponse": [
    {
      "audio": "base64-encoded-audio-string",
      "audioContentType": "audio/wav"
    }
  ]
}
```

#### Translation Request/Response

```javascript
// Translation Request
const translationRequest = {
  pipelineId: "643930aa521a4b1ba0f4c41d",
  input: [
    {
      source: "The weather is nice today"
    }
  ],
  config: {
    language: {
      sourceLanguage: "en",
      targetLanguage: "hi"
    }
  }
};

// Translation Response
{
  "pipelineResponse": [
    {
      "output": [
        {
          "targetText": "आज मौसम अच्छा है"
        }
      ]
    }
  ]
}
```

---

## 5. Vaani Architecture — Current vs With Bhashini

### 5.1 Current Architecture (Without Bhashini)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vaani (Current)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Speaks ──► Web Speech API ──► Text                        │
│                      (blocked on Brave/Firefox)                 │
│                      (limited: hi, ta, te only)                │
│                                                                 │
│  Text ──► Gemini API ──► Response                               │
│                    (rate limited)                               │
│                                                                 │
│  Response ──► Browser TTS ──► Audio Output                      │
│                      (robotic quality, limited languages)       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Limitations:**
- Web Speech API blocked or severely limited on Brave, Firefox
- No support for Bengali, Marathi, Gujarati, Kannada, Malayalam, etc.
- Browser TTS produces robotic, unnatural speech
- Language support varies drastically across browsers and OS

### 5.2 Proposed Architecture with Bhashini

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Vaani (With Bhashini)                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PRIMARY PATH (Browser-supported):                                     │
│  User Speaks ──► Bhashini ASR ──► Tamil Text                           │
│                      (22+ languages, works everywhere)                 │
│                                                                         │
│  Tamil Text ──► Gemini API ──► Response in Tamil                        │
│                           (via IndicTrans if needed)                   │
│                                                                         │
│  Tamil Response ──► Bhashini TTS ──► Tamil Audio                        │
│                          (natural neural voice)                         │
│                                                                         │
│  ─────────────────────────────────────────────────────────────          │
│                                                                         │
│  FALLBACK PATH (Brave/Firefox):                                        │
│  User Speaks ──► MediaRecorder ──► Audio Blob                          │
│                      │                                                 │
│                      ▼                                                 │
│               Groq Whisper API ──► English Text                        │
│                      │                                                 │
│                      ▼                                                 │
│               Translation (IndicTrans) ──► Target Language            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Benefits:**
- 22+ Indian languages supported natively
- Works on all browsers (Chrome, Firefox, Brave, Safari, Edge)
- Natural-sounding voice output
- Redundant STT paths for reliability
- Cross-language communication possible

---

## 6. Integration Plan for Vaani

### Phase 1: TTS Replacement (Quick Win) — Week 1-2

**Objective:** Replace browser TTS with Bhashini TTS for quality improvement.

**Tasks:**
- [ ] Register at bhashini.gov.in and generate API keys
- [ ] Create `bhashiniService.js` module
- [ ] Implement TTS function with Bhashini API
- [ ] Add fallback to browser TTS if Bhashini fails
- [ ] Add retry logic with exponential backoff
- [ ] Test with Hindi, Tamil, Bengali voices

**Code Structure:**
```javascript
// bhashiniService.js
export async function synthesizeSpeech(text, language = 'hi') {
  try {
    const response = await fetch(TTS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.BHASHINI_API_KEY
      },
      body: JSON.stringify({
        text,
        language,
        voice: getVoiceForLanguage(language)
      })
    });
    
    if (!response.ok) throw new Error('Bhashini TTS failed');
    
    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.warn('Bhashini TTS failed, falling back to browser TTS');
    return fallbackBrowserTTS(text);
  }
}
```

### Phase 2: STT Augmentation — Week 3-4

**Objective:** Add Bhashini ASR alongside existing Web Speech + Groq Whisper.

**Tasks:**
- [ ] Implement Bhashini ASR in `bhashiniService.js`
- [ ] Add ASR as a selectable engine in `useVoice.js`
- [ ] Create priority-based STT engine selection:
  1. Bhashini ASR (primary for supported languages)
  2. Web Speech API (secondary for Chrome)
  3. Groq Whisper (fallback for unsupported browsers)
- [ ] Test with 5 languages: Hindi, Tamil, Telugu, Bengali, Marathi
- [ ] Monitor accuracy and latency

**Language Priority:**
```javascript
const LANGUAGE_STT_ENGINE = {
  hi: 'bhashini',  // Hindi - Bhashini primary
  ta: 'bhashini',  // Tamil - Bhashini primary
  te: 'bhashini',  // Telugu - Bhashini primary
  bn: 'bhashini',  // Bengali - Bhashini primary
  mr: 'bhashini',  // Marathi - Bhashini primary
  default: 'web speech'  // Others - Web Speech fallback
};
```

### Phase 3: Translation Pipeline (Future) — Week 5-6

**Objective:** Enable Indic-to-Indic translation for cross-language communication.

**Tasks:**
- [ ] Integrate AI4Bharat's IndicTrans model
- [ ] Build translation middleware for non-Gemini-supported languages
- [ ] Implement Indic-to-English-to-Indic routing
- [ ] Test cross-language conversations
- [ ] Optimize for real-time performance

---

## 7. Pricing and Free Tier

### Free Tier (Current)

| Service | Free Limit | Notes |
|---------|------------|-------|
| ULCA API | 10,000 calls/month | For PoC and development |
| Direct TTS | 1,000 requests/month | Limited voice options |
| Direct ASR | 1,000 minutes/month | Audio duration |
| Translation | 10,000 characters/month | — |

### What "PoC Only" Means

Bhashini's free tier is intended for:
- Proof of concept development
- Learning and experimentation
- Non-commercial projects
- Small-scale testing

### Commercial Pricing

For production workloads, commercial pricing is available through:
- MeitY subsidized rates for startups/NGOs
- Pay-per-use via ULCA platform
- Volume discounts for high-traffic applications

### Cost Comparison

| Service Provider | TTS Cost | STT Cost | Indian Language Support |
|------------------|----------|----------|-------------------------|
| Bhashini | ~₹0.10/min | ~₹0.15/min | 22+ languages |
| Google Cloud TTS | ~$4/100k characters | — | Limited Indic |
| AWS Polly | ~$4/100k characters | — | 1-2 Indic voices |
| Azure Speech | ~$1/100k characters | ~$1/1000 transactions | Limited |

**Bhashini is significantly cheaper for Indian language use cases.**

---

## 8. Supported Languages

| Language | ISO Code | Script | ASR | TTS | Translation | Priority |
|----------|----------|--------|-----|-----|-------------|----------|
| Hindi | hi | Devanagari | ✅ | ✅ | ✅ | High |
| English | en | Latin | ✅ | ✅ | ✅ | High |
| Bengali | bn | Bengali | ✅ | ✅ | ✅ | High |
| Tamil | ta | Tamil | ✅ | ✅ | ✅ | High |
| Telugu | te | Telugu | ✅ | ✅ | ✅ | High |
| Marathi | mr | Devanagari | ✅ | ✅ | ✅ | High |
| Gujarati | gu | Gujarati | ✅ | ✅ | ✅ | Medium |
| Kannada | kn | Kannada | ✅ | ✅ | ✅ | Medium |
| Malayalam | ml | Malayalam | ✅ | ✅ | ✅ | Medium |
| Punjabi | pa | Gurmukhi | ✅ | ✅ | ✅ | Medium |
| Odia | or | Odia | ✅ | ✅ | ✅ | Medium |
| Assamese | as | Bengali | ✅ | ✅ | ✅ | Low |
| Urdu | ur | Arabic | ✅ | ✅ | ✅ | Medium |
| Nepali | ne | Devanagari | ✅ | ✅ | ✅ | Low |
| Sanskrit | sa | Devanagari | ✅ | ✅ | ✅ | Low |
| Manipuri | mni | Bengali | ✅ | ✅ | ✅ | Low |
| Konkani | kok | Devanagari | ✅ | ✅ | ✅ | Low |
| Khasi | kha | Latin | ✅ | ✅ | ✅ | Low |
| Mizo | lus | Latin | ✅ | ✅ | ✅ | Low |
| Bodo | brx | Devanagari | ✅ | ✅ | ✅ | Low |
| Dogri | doi | Devanagari | ✅ | ✅ | ✅ | Low |
| Maithili | mai | Devanagari | ✅ | ✅ | ✅ | Low |
| Santali | sat | Ol Chiki | ✅ | ✅ | ✅ | Low |

**Priority Ranking:**
- **High**: Hindi, English, Bengali, Tamil, Telugu, Marathi — Full integration first
- **Medium**: Gujarati, Kannada, Malayalam, Punjabi, Odia, Urdu — Phase 2
- **Low**: Remaining languages — Future enhancement

---

## 9. Implementation Checklist

### Prerequisites
- [ ] Register at https://bhashini.gov.in
- [ ] Generate userID and API keys from dashboard
- [ ] Join ULCA platform at https://services.bhashini.gov.in/
- [ ] Review API documentation at https://bhashini.gitbook.io/bhashini-apis/

### Phase 1: TTS Integration
- [ ] Create `src/services/bhashiniService.js`
- [ ] Implement `synthesizeSpeech(text, language)` function
- [ ] Add error handling and retry logic
- [ ] Implement browser TTS fallback
- [ ] Test TTS with Hindi (hi), Tamil (ta), Bengali (bn)
- [ ] Verify audio quality vs browser TTS
- [ ] Update `useVoice.js` to use Bhashini TTS

### Phase 2: STT Integration
- [ ] Implement `transcribeAudio(audioBlob, language)` function
- [ ] Add Bhashini ASR to STT engine options
- [ ] Create engine selection logic in `useVoice.js`
- [ ] Test with 5 languages: hi, ta, te, bn, mr
- [ ] Compare accuracy with Web Speech API
- [ ] Add latency monitoring
- [ ] Implement fallback chain: Bhashini → Web Speech → Whisper

### Phase 3: Translation (Future)
- [ ] Set up AI4Bharat IndicTrans access
- [ ] Implement `translateText(text, from, to)` function
- [ ] Add translation middleware for non-Gemini languages
- [ ] Test Indic-to-Indic translation quality
- [ ] Optimize for <500ms translation latency

### Monitoring & Deployment
- [ ] Set up API usage monitoring
- [ ] Configure rate limiting
- [ ] Add cost tracking alerts
- [ ] Deploy to staging environment
- [ ] A/B test Bhashini vs browser TTS
- [ ] Deploy to production
- [ ] Monitor error rates and user feedback

---

## 10. References

### Official Resources
- **Bhashini Portal**: https://bhashini.gov.in/
- **ULCA Platform**: https://services.bhashini.gov.in/
- **API Documentation**: https://bhashini.gitbook.io/bhashini-apis/
- **GitHub Examples**: https://github.com/bhashini-ai/bhashini-api-examples

### Technical Resources
- **AI4Bharat**: https://ai4bharat.iitm.ac.in/
- **IndicTrans Model**: https://github.com/AI4Bharat/IndicTrans
- **Bhashini GitHub**: https://github.com/bhashini-ai
- **Model Zoo**: https://modelzoo.bhashini.ai/

### Community & Support
- **Discord**: Bhashini community channels
- **Email**: bhashini-support@meity.gov.in
- **Issues**: https://github.com/bhashini-ai/bhashini-api-examples/issues

### Related Vaani Files
- `src/services/voiceService.js` — Current voice implementation
- `src/hooks/useVoice.js` — Voice hook
- `src/services/geminiService.js` — LLM integration

---

*Document Version: 1.0*  
*Last Updated: April 2026*  
*Prepared for: Vaani Development Team*

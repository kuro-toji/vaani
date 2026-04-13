# ⚠️ DEPRECATED — DO NOT USE

This `server/` folder contains the old Express backend proxy that was used to relay
API calls to Gemini, ElevenLabs, and other services.

**As of April 2026, ALL API calls are made directly from the frontend using
`import.meta.env.VITE_*` API keys. This server is completely unused.**

The folder is kept only for historical reference. Do not start it, do not deploy it,
and do not import anything from it.

If you need to understand the current API integration, see:
- `src/services/geminiService.js` — Direct Gemini 1.5 Flash calls
- `src/services/promptBuilder.js` — System prompt construction
- `src/services/promptTrimmer.js` — Topic-aware prompt trimming

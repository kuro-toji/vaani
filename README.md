# 🔊 Vaani — AI Personal Finance Assistant for Bharat

Vaani is a voice-first, multilingual personal finance assistant designed for rural and semi-urban Indians. It supports **28 Indian languages**, works with voice input for users who can't type, and provides accessible financial guidance on savings, investments, insurance, and government schemes.

## ✨ Features

- 🗣️ **Voice-first**: Speak in any Indian language — Hindi, Tamil, Telugu, Bengali, Marathi, and 23 more
- 🌐 **28 Languages**: Auto-detects language from pincode or manual selection
- 🤖 **Gemini 1.5 Flash**: AI-powered financial advice, not generic chatbot responses
- ♿ **Accessible**: Large tap targets, traffic light mode for cognitive impairment, icon cards for speech-impaired users
- 📱 **Mobile-optimized**: PWA-ready, works on low-end Android devices
- 🔒 **No backend required**: Runs entirely in the browser (direct Gemini API calls)

---

## 🚀 Quick Start (Frontend Only)

This is the simplest way to run Vaani. No backend server needed.

```bash
# 1. Clone the repo
git clone <repo-url> && cd vaani

# 2. Install dependencies
npm install

# 3. Create .env with your Gemini API key
echo "VITE_GEMINI_API_KEY=your_gemini_api_key_here" > .env

# 4. Run the dev server
npm run dev
```

Open **http://localhost:5173** in Chrome. That's it!

---

## 🔧 Full Start (Frontend + Backend)

If you want to run the Express backend too (for server-side Gemini calls, Groq Whisper STT, etc.):

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend dependencies
cd server && npm install && cd ..

# 3. Set up environment variables
#    Root .env (for frontend):
echo "VITE_GEMINI_API_KEY=your_gemini_api_key_here" > .env

#    Server .env (for backend):
cp server/.env.example server/.env
#    Edit server/.env and add your GEMINI_API_KEY

# 4. Run both frontend and backend concurrently
npm run dev:full
```

- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:3001**

> **How it works**: The app first tries the local backend (`/api/gemini/chat`). If the server isn't running, it falls back to calling Gemini API directly from the browser. Either way, it just works.

---

## 📁 Project Structure

```
vaani/
├── src/
│   ├── components/      # React UI components
│   ├── context/         # React contexts (Accessibility, CognitiveMode)
│   ├── data/            # Static data (languages, pincodes, digit maps)
│   ├── hooks/           # Custom hooks (useChat, useVoice, useVibration)
│   ├── pages/           # LandingPage
│   └── services/        # API services (gemini, pincode, prompt builder)
├── server/              # Express backend (optional)
│   ├── index.js
│   ├── routes/
│   └── .env.example
├── .env                 # Frontend env vars (VITE_GEMINI_API_KEY)
├── vite.config.js       # Vite config with /api proxy
└── package.json
```

---

## 🔑 Environment Variables

### Frontend (`.env` in root)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GEMINI_API_KEY` | ✅ Yes | Google Gemini API key |
| `VITE_GROQ_API_KEY` | ❌ No | Groq API key (for cloud Whisper STT) |

### Backend (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Same Gemini API key |
| `PORT` | ❌ No | Server port (default: 3001) |
| `GROQ_API_KEY` | ❌ No | Groq API key |

---

## 🛠️ Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend only (direct Gemini calls) |
| `npm run dev:full` | Start frontend + backend concurrently |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

---

## 🌍 Supported Languages

Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Maithili, Santali, Kashmiri, Nepali, Sindhi, Konkani, Dogri, Bodo, Manipuri, Sanskrit, Bhojpuri, Rajasthani, Chhattisgarhi, Tulu, Haryanvi, Magahi, English.

---

## 📋 License

MIT

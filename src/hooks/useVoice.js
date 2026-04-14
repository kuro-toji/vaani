import { useState, useRef, useCallback, useEffect } from 'react'
import { webSpeechSupported, whisperOnly, whisperLangMap } from '../data/speechLanguages'
import { speakWithElevenLabs, isElevenLabsConfigured } from '../services/elevenLabsService.js'

/* ─────────────────────────────────────────────
 * Module-level Brave detection
 * ───────────────────────────────────────────── */
const IS_BRAVE = typeof navigator !== 'undefined' && !!navigator.brave

/* ─────────────────────────────────────────────
 * Module-level Whisper singleton
 * ───────────────────────────────────────────── */
let whisperPipeline = null
let whisperLoading = false

async function loadWhisper() {
  if (whisperPipeline) return whisperPipeline
  if (whisperLoading) {
    while (whisperLoading) {
      await new Promise(r => setTimeout(r, 200))
    }
    return whisperPipeline
  }
  whisperLoading = true
  let attempts = 0
  while (attempts < 2) {
    try {
      const { pipeline } = await import('@xenova/transformers')
      whisperPipeline = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-small',
        { quantized: true }
      )
      break
    } catch (err) {
      attempts++
      if (attempts >= 2) { whisperLoading = false; throw err }
      await new Promise(r => setTimeout(r, 3000))
    }
  }
  whisperLoading = false
  return whisperPipeline
}

/* ─────────────────────────────────────────────
 * Script-range detection for hallucination guard
 * ───────────────────────────────────────────── */
const SCRIPT_RANGES = {
  hindi:     /[\u0900-\u097F]/,   // Devanagari
  bengali:   /[\u0980-\u09FF]/,
  telugu:    /[\u0C00-\u0C7F]/,
  tamil:     /[\u0B80-\u0BFF]/,
  marathi:   /[\u0900-\u097F]/,   // Devanagari
  gujarati:  /[\u0A80-\u0AFF]/,
  kannada:   /[\u0C80-\u0CFF]/,
  malayalam: /[\u0D00-\u0D7F]/,
  punjabi:   /[\u0A00-\u0A7F]/,   // Gurmukhi
  odia:      /[\u0B00-\u0B7F]/,
  assamese:  /[\u0980-\u09FF]/,   // Bengali script
  urdu:      /[\u0600-\u06FF]/,   // Arabic
  english:   /[a-zA-Z]/,
  nepali:    /[\u0900-\u097F]/,
  kashmiri:  /[\u0600-\u06FF]/,
  sindhi:    /[\u0600-\u06FF]/,
  maithili:  /[\u0900-\u097F]/,
  konkani:   /[\u0900-\u097F]/,
  sanskrit:  /[\u0900-\u097F]/,
}

function isHallucination(text, whisperLang) {
  if (!text || text.length < 2) return true

  // Check 1: same word repeated 3+ times
  const words = text.trim().split(/\s+/)
  if (words.length >= 3) {
    const counts = {}
    for (const w of words) {
      const lower = w.toLowerCase()
      counts[lower] = (counts[lower] || 0) + 1
      if (counts[lower] >= 3) return true
    }
  }

  // Check 2: wrong script (e.g. Korean/Chinese/Japanese when Hindi expected)
  // CJK ranges: \u3000-\u9FFF, \uAC00-\uD7AF
  if (/[\u3000-\u9FFF\uAC00-\uD7AF]/.test(text) && whisperLang !== 'korean' && whisperLang !== 'chinese' && whisperLang !== 'japanese') {
    return true
  }

  // Check 3: expected script not found at all (for non-English/non-Latin languages)
  const expectedRange = SCRIPT_RANGES[whisperLang]
  if (expectedRange && whisperLang !== 'english') {
    // If text has zero characters in the expected script and is more than a few chars, suspect hallucination
    if (text.length > 5 && !expectedRange.test(text)) {
      return true
    }
  }

  return false
}

/* ─────────────────────────────────────────────
 * Mic audio constraints (shared)
 * ───────────────────────────────────────────── */
const MIC_CONSTRAINTS = {
  audio: {
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
  }
}

/* ─────────────────────────────────────────────
 * Pad audio buffer with silence
 * ───────────────────────────────────────────── */
function padWithSilence(float32, sampleRate, padSeconds = 0.5) {
  const padSamples = Math.floor(sampleRate * padSeconds)
  const padded = new Float32Array(padSamples + float32.length + padSamples)
  // Leading silence is already 0; copy audio; trailing silence is already 0
  padded.set(float32, padSamples)
  return padded
}

/* ─────────────────────────────────────────────
 * Groq language code mapping
 * ───────────────────────────────────────────── */
function mapToGroqLanguage(langCode) {
  const map = {
    hi: 'hi', bn: 'bn', te: 'te', ta: 'ta', mr: 'mr',
    ur: 'ur', gu: 'gu', kn: 'kn', ml: 'ml', pa: 'pa',
    or: 'or', ne: 'ne', as: 'as', en: 'en',
    mai: 'hi', sat: 'hi', ks: 'ks', sd: 'sd',
    kok: 'hi', dgo: 'hi', brx: 'hi', mni: 'hi',
    sa: 'hi', bho: 'hi', raj: 'hi', hne: 'hi',
    tcy: 'kn', bgc: 'hi', mag: 'hi',
  }
  return map[langCode] || 'auto'
}

/* ═════════════════════════════════════════════
 * useVoice hook
 * ═════════════════════════════════════════════ */
export function useVoice() {
  const [isListening, setIsListening] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [isWhisperMode, setIsWhisperMode] = useState(false)
  const [transcript, setTranscript] = useState('')     // Pre-send preview
  const [sttError, setSttError] = useState(null)
  const [countdown, setCountdown] = useState(null)      // Seconds until auto-send

  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const recordingStartTimeRef = useRef(null)
  const whisperOnlyRef = useRef(new Set(whisperOnly))
  const onResultCallbackRef = useRef(null)
  const onErrorCallbackRef = useRef(null)
  const countdownTimerRef = useRef(null)
  const autoSendTimerRef = useRef(null)

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      clearTimers()
      if (recognitionRef.current) { try { recognitionRef.current.abort() } catch (e) {} }
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()) }
    }
  }, [])

  function clearTimers() {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current)
    countdownTimerRef.current = null
    autoSendTimerRef.current = null
    setCountdown(null)
  }

  /* ── Start auto-send countdown (2 seconds) ── */
  function startAutoSendCountdown(text) {
    clearTimers()
    let remaining = 2
    setCountdown(remaining)

    countdownTimerRef.current = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current)
        countdownTimerRef.current = null
      }
    }, 1000)

    autoSendTimerRef.current = setTimeout(() => {
      setCountdown(null)
      // Fire the final result — the consumer should send it
      onResultCallbackRef.current?.(text, true)
      setTranscript('')
    }, 2000)
  }

  /* ═══════════════════════════════════════════
   * MODE 1: Web Speech API
   * ═══════════════════════════════════════════ */
  const startWebSpeech = useCallback(async (onResult, onError, language) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSttError('Voice not supported in this browser. Use Chrome.')
      onError?.('Voice not supported')
      return
    }

    // Mic permission check
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Mic access requires HTTPS (or localhost)')
      }
      const tempStream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS)
      tempStream.getTracks().forEach(t => t.stop())
    } catch (err) {
      console.error('WebSpeech mic permission err:', err)
      if (err.name === 'NotAllowedError') {
        setSttError('Microphone permission restricted. Allow in browser settings.')
      } else if (err.name === 'NotFoundError') {
        setSttError('No microphone found on device.')
      } else {
        setSttError(err.message || 'Microphone access failed.')
      }
      onError?.(err.message)
      return
    }

    // Stop previous
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch (e) {} }

    // 400ms delay to avoid capturing the tap noise
    await new Promise(r => setTimeout(r, 400))

    const recognition = new SpeechRecognition()
    recognition.lang = webSpeechSupported[language] || 'hi-IN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      let currentTranscript = ''
      let isFinal = false
      for (let i = 0; i < e.results.length; i++) {
        currentTranscript += e.results[i][0].transcript
        if (e.results[i].isFinal) isFinal = true
      }
      // Show interim results as preview
      setTranscript(currentTranscript)
      if (isFinal) {
        setIsListening(false)
        // Start auto-send countdown — user can edit/cancel during this time
        startAutoSendCountdown(currentTranscript)
      }
    }

    recognition.onerror = (e) => {
      if (e.error === 'network' || e.error === 'service-not-allowed') {
        // Silently mark for Whisper fallback and retry
        whisperOnlyRef.current.add(language)
        setIsListening(false)
        // Auto-retry with Whisper — no error shown to user
        startWhisper(onResult, onError, language)
        return
      } else if (e.error === 'no-speech') {
        setSttError('कुछ सुनाई नहीं दिया, दोबारा बोलें')
      } else if (e.error === 'not-allowed') {
        setSttError('Microphone permission denied.')
      } else if (e.error === 'aborted') {
        // User stopped — not an error
      } else {
        setSttError(`Error: ${e.error}`)
      }
      onError?.(e.error)
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    try {
      recognition.start()
      setIsListening(true)
      setIsWhisperMode(false)
    } catch (err) {
      // Recognition failed to start — fall back to Whisper
      whisperOnlyRef.current.add(language)
      startWhisper(onResult, onError, language)
    }
  }, [])

  /* ═══════════════════════════════════════════
   * MODE 2: Whisper (Groq cloud → local fallback)
   * ═══════════════════════════════════════════ */
  const startWhisper = useCallback(async (onResult, onError, language) => {
    setSttError(null)
    setIsWhisperMode(true)

    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    // Request microphone
    let stream
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Mic access requires HTTPS (or localhost)')
      }
      stream = await navigator.mediaDevices.getUserMedia(MIC_CONSTRAINTS)
    } catch (err) {
      console.error('Whisper mic err:', err)
      if (err.name === 'NotAllowedError') {
        setSttError('Microphone permission restricted. Allow in browser settings.')
      } else if (err.name === 'NotFoundError') {
        setSttError('No microphone found on device.')
      } else {
        setSttError(err.message || 'Microphone access failed.')
      }
      onError?.(err.message)
      return
    }
    streamRef.current = stream

    // 400ms delay to skip tap noise
    await new Promise(r => setTimeout(r, 400))

    // VAD + noise gate
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)

    const lowpass = audioContext.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 4000
    source.connect(lowpass)
    lowpass.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const VOLUME_THRESHOLD = 50
    const WAIT_TIME = 2000

    const waitForVoice = () => {
      return new Promise((resolve, reject) => {
        let silenceTimer = null
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray)
          const volume = Math.max(...dataArray)
          if (volume > VOLUME_THRESHOLD) {
            clearTimeout(silenceTimer)
            resolve()
          } else {
            silenceTimer = setTimeout(() => reject(new Error('No speech detected')), 10000)
            requestAnimationFrame(checkVolume)
          }
        }
        checkVolume()
      })
    }

    audioChunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
    })
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (e) => {
      if (e.data?.size > 0) audioChunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      try { audioContext.close() } catch (e) {}
      setIsListening(false)

      // ── Minimum duration check (1.5s) ──
      const elapsed = Date.now() - (recordingStartTimeRef.current || 0)
      if (elapsed < 1500) {
        setSttError('थोड़ा और बोलें')
        onError?.('Recording too short')
        return
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const whisperLang = whisperLangMap[language] || 'hindi'

      // ── Try Groq Cloud first ──
      if (apiKey) {
        try {
          const formData = new FormData()
          formData.append('file', audioBlob, 'audio.webm')
          formData.append('model', 'whisper-large-v3-turbo')
          formData.append('language', mapToGroqLanguage(language))

          const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: formData,
          })

          if (response.ok) {
            const data = await response.json()
            const text = data.text?.trim() || ''

            if (text) {
              setTranscript(text)
              startAutoSendCountdown(text)
              return
            }
          }
        } catch {
          // Groq failed — fall through
        }
      }

      // ── Fallback: local Whisper via @xenova/transformers ──
      try {
        if (!whisperPipeline) {
          setIsModelLoading(true)
          let loaded = false, attempts = 0
          while (!loaded && attempts < 2) {
            try {
              await loadWhisper()
              loaded = true
            } catch (err) {
              attempts++
              if (attempts >= 2) {
                setIsModelLoading(false)
                setSttError('Could not load speech model. Check your connection.')
                onError?.('Model load failed')
                return
              }
              await new Promise(r => setTimeout(r, 3000))
            }
          }
          setIsModelLoading(false)
        }

        const arrayBuffer = await audioBlob.arrayBuffer()
        const decodeCtx = new AudioContext({ sampleRate: 16000 })
        const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer)
        const rawFloat32 = audioBuffer.getChannelData(0)
        try { decodeCtx.close() } catch (e) {}

        // Pad 0.5s silence at start and end to reduce edge hallucinations
        const float32 = padWithSilence(rawFloat32, 16000, 0.5)

        const result = await whisperPipeline(float32, {
          language: whisperLang,
          task: 'transcribe',
          chunk_length_s: 30,
        })

        const text = result.text?.trim() || ''

        if (!text) {
          setSttError('ठीक से सुनाई नहीं दिया, दोबारा बोलें')
          onError?.('Empty transcription')
          return
        }

        setTranscript(text)
        startAutoSendCountdown(text)
      } catch {
        setSttError('Could not transcribe. Please type instead.')
        onError?.('Transcription failed')
      }
    }

    // Start recording only after voice detected
    try {
      await waitForVoice()
      recordingStartTimeRef.current = Date.now()
      mediaRecorder.start(1000)
      setIsListening(true)
    } catch {
      setSttError('No speech detected. Please try again.')
      onError?.('No speech detected')
      stream.getTracks().forEach(t => t.stop())
      try { audioContext.close() } catch (e) {}
    }
  }, [])

  /* ═══════════════════════════════════════════
   * Public API: startListening / stopListening
   * ═══════════════════════════════════════════ */
  const startListening = useCallback((onResult, onError, language = 'hi') => {
    setSttError(null)
    setTranscript('')
    clearTimers()

    // Store callbacks for auto-send
    onResultCallbackRef.current = onResult
    onErrorCallbackRef.current = onError

    // If Brave, always use Whisper — skip Web Speech entirely
    const useWhisper = IS_BRAVE ||
      whisperOnlyRef.current.has(language) ||
      !webSpeechSupported[language]

    if (useWhisper) {
      startWhisper(onResult, onError, language)
    } else {
      startWebSpeech(onResult, onError, language)
    }
  }, [startWebSpeech, startWhisper])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setIsListening(false)
  }, [])

  /* ── Confirm / Cancel pre-send preview ── */
  const confirmSend = useCallback(() => {
    clearTimers()
    const text = transcript
    if (text) {
      onResultCallbackRef.current?.(text, true)
    }
    setTranscript('')
  }, [transcript])

  const cancelSend = useCallback(() => {
    clearTimers()
    setTranscript('')
  }, [])

  /* ═══════════════════════════════════════════
   * TTS: speak / stopSpeaking — Pure Web Speech API
   * ═══════════════════════════════════════════ */

  /**
   * Split text on sentence boundaries for reliable long-text TTS.
   * Indian scripts use '।' (devanagari danda), others use '.'
   */
  function splitIntoSentences(text) {
    // Split on ।, ?, !, or . followed by whitespace/end, but keep short fragments together
    const raw = text.split(/(?<=[।\?\!\.])\s+/g).filter(s => s.trim().length > 0)
    // Merge very short fragments (< 10 chars) with the next sentence
    const merged = []
    for (const s of raw) {
      if (merged.length > 0 && merged[merged.length - 1].length < 10) {
        merged[merged.length - 1] += ' ' + s
      } else {
        merged.push(s)
      }
    }
    return merged.length > 0 ? merged : [text]
  }

  /**
   * Resolve the best matching voice for a BCP-47 locale.
   */
  async function resolveVoice(targetLang) {
    let voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      await new Promise((resolve) => {
        window.speechSynthesis.onvoiceschanged = () => {
          voices = window.speechSynthesis.getVoices()
          resolve()
        }
        setTimeout(resolve, 500)
      })
    }
    const exactMatch = voices.find(v => v.lang === targetLang)
    if (exactMatch) return exactMatch
    const prefix = targetLang.split('-')[0]
    const prefixMatch = voices.find(v => v.lang.startsWith(prefix))
    if (prefixMatch) return prefixMatch
    const indianVoice = voices.find(v => v.lang.includes('IN'))
    return indianVoice || null
  }

  /**
   * Speak a single sentence and return a promise that resolves when done.
   */
  function speakSentence(sentence, targetLang, voice) {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(sentence)
      utterance.lang = targetLang
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0
      if (voice) utterance.voice = voice
      utterance.onend = resolve
      utterance.onerror = resolve  // Don't block the chain on error
      window.speechSynthesis.speak(utterance)
    })
  }

  const speak = useCallback(async (text, language = 'hi') => {
    if (!text) return;
    window.speechSynthesis?.cancel();
    
    // Check if premium voice is enabled (off by default to save credits)
    const usePremiumVoice = localStorage.getItem('vaani_premium_voice') === '1';
    
    if (usePremiumVoice && isElevenLabsConfigured()) {
      try {
        // Only send first 150 chars to ElevenLabs to save credits
        const ttsText = text.substring(0, 150);
        await speakWithElevenLabs(ttsText, language);
        // If more text remains, read the rest with Web Speech
        if (text.length > 150) {
          const remaining = text.substring(150);
          const targetLang = webSpeechSupported[language] || 'hi-IN';
          const voice = await resolveVoice(targetLang);
          const sentences = splitIntoSentences(remaining);
          for (const sentence of sentences) {
            await speakSentence(sentence, targetLang, voice);
          }
        }
        return;
      } catch {
        // Fall through to Web Speech
      }
    }
    
    // Default: Web Speech API (free, unlimited)
    if (!('speechSynthesis' in window)) return;
    const targetLang = webSpeechSupported[language] || 'hi-IN';
    const voice = await resolveVoice(targetLang);
    const sentences = splitIntoSentences(text);
    for (const sentence of sentences) {
      await speakSentence(sentence, targetLang, voice);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  /* ── Preload Whisper model on mount ── */
  useEffect(() => {
    if (!whisperPipeline && !whisperLoading) {
      setIsModelLoading(true)
      loadWhisper()
        .catch(() => {})
        .finally(() => setIsModelLoading(false))
    }
  }, [])

  return {
    // STT state
    isListening,
    isModelLoading,
    isWhisperMode,
    isBraveMode: IS_BRAVE,  // consumers can show a notice
    transcript,          // Pre-send preview text
    sttError,
    countdown,           // Auto-send countdown (seconds remaining, null if inactive)

    // STT actions
    startListening,
    stopListening,
    confirmSend,         // Immediately send transcript
    cancelSend,          // Cancel pending auto-send

    // TTS
    speak,
    stopSpeaking,
  }
}

export default useVoice

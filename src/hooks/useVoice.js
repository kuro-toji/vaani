import { useState, useRef, useCallback, useEffect } from 'react'
import { webSpeechSupported, whisperOnly, whisperLangMap } from '../data/speechLanguages'

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
  try {
    const { pipeline } = await import('@xenova/transformers')
    whisperPipeline = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-small',
      { quantized: true }
    )
  } finally {
    whisperLoading = false
  }
  return whisperPipeline
}

export function useVoice() {
  const [isListening, setIsListening] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [sttError, setSttError] = useState(null)
  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const whisperOnlyRef = useRef(new Set(whisperOnly))

  const startListening = useCallback((onResult, onError, language = 'hi') => {
    setSttError(null)

    const useWhisper = whisperOnlyRef.current.has(language) || !webSpeechSupported[language]

    if (useWhisper) {
      startWhisper(onResult, onError, language)
    } else {
      startWebSpeech(onResult, onError, language)
    }
  }, [])

  const startWebSpeech = useCallback((onResult, onError, language) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSttError('Voice not supported in this browser. Use Chrome.')
      onError?.('Voice not supported')
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
    }

    const recognition = new SpeechRecognition()
    recognition.lang = webSpeechSupported[language] || 'hi-IN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      let transcript = ''
      let isFinal = false
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript
        isFinal = e.results[i].isFinal
      }
      onResult?.(transcript, isFinal)
    }

    recognition.onerror = (e) => {
      if (e.error === 'network') {
        // Self-heal: mark this language as whisper-only for rest of session
        whisperOnlyRef.current.add(language)
        setSttError('Switched to offline mode. Click mic again to try.')
      } else if (e.error === 'not-allowed') {
        setSttError('Microphone permission denied.')
      } else if (e.error === 'no-speech') {
        setSttError('No speech detected. Try again.')
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
    } catch (err) {
      setSttError(err.message)
      onError?.(err.message)
    }
  }, [])

  const startWhisper = useCallback(async (onResult, onError, language) => {
    setSttError(null)

    // Load model in background if needed
    if (!whisperPipeline) {
      setIsModelLoading(true)
      try {
        await loadWhisper()
      } catch (err) {
        setIsModelLoading(false)
        setSttError('Could not load speech model.')
        onError?.('Model load failed')
        return
      }
      setIsModelLoading(false)
    }

    // Request microphone
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setSttError('Microphone permission denied.')
      onError?.('Permission denied')
      return
    }
    streamRef.current = stream

    // Start recording
    audioChunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
    })
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      setIsListening(false)

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      try {
        const arrayBuffer = await audioBlob.arrayBuffer()
        const audioContext = new AudioContext({ sampleRate: 16000 })
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        const float32 = audioBuffer.getChannelData(0)

        const whisperLang = whisperLangMap[language] || 'hindi'
        const result = await whisperPipeline(float32, {
          language: whisperLang,
          task: 'transcribe',
          chunk_length_s: 30,
        })
        onResult?.(result.text.trim(), true)
      } catch {
        setSttError('Could not transcribe. Please type instead.')
        onError?.('Transcription failed')
      }
    }

    mediaRecorder.start(1000)
    setIsListening(true)
  }, [])

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

  const speak = useCallback((text, language = 'hi') => {
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = `urn:cc:ache:locale:${language}`
    utterance.rate = 0.9
    utterance.onstart = () => {}
    utterance.onend = () => {}
    utterance.onerror = () => {}
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  // Preload whisper model for whisper-only languages on mount
  useEffect(() => {
    if (!whisperPipeline && !whisperLoading) {
      loadWhisper().catch(() => {})
    }
  }, [])

  return {
    isListening,
    isModelLoading,
    sttError,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}

export default useVoice

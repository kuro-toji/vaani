import { useState, useRef, useCallback, useEffect } from 'react'
import { webSpeechSupported, whisperOnly, whisperLangMap } from '../data/speechLanguages'
import { speakWithElevenLabs, isElevenLabsConfigured } from '../services/elevenLabsService.js'

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
      if (attempts >= 2) throw err
      await new Promise(r => setTimeout(r, 3000)) // wait 3s before retry
    }
  }
  whisperLoading = false
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

  function mapToGroqLanguage(langCode) {
    const map = {
      hi: 'hi', bn: 'bn', te: 'te', ta: 'ta', mr: 'mr',
      ur: 'ur', gu: 'gu', kn: 'kn', ml: 'ml', pa: 'pa',
      or: 'or', ne: 'ne', as: 'as', en: 'en',
      mai: 'hi', sat: 'hi', ks: 'ks', sd: 'sd',
      kok: 'hi', dgo: 'hi', brx: 'hi', mni: 'hi',
      sa: 'hi', bho: 'hi', raj: 'hi', hne: 'hi',
      tcy: 'kn', bgc: 'hi', mag: 'hi',
    };
    return map[langCode] || 'auto';
  }

  const startWebSpeech = useCallback(async (onResult, onError, language) => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSttError('Voice not supported in this browser. Use Chrome.')
      onError?.('Voice not supported')
      return
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Mic access requires HTTPS (or localhost)');
      }
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tempStream.getTracks().forEach(t => t.stop());
    } catch (err) {
      console.error('WebSpeech mic permission err:', err);
      if (err.name === 'NotAllowedError') {
        setSttError('Microphone permission restricted. Allow in browser settings.');
      } else if (err.name === 'NotFoundError') {
        setSttError('No microphone found on device.');
      } else {
        setSttError(err.message || 'Microphone access failed.');
      }
      onError?.(err.message);
      return;
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
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    // Request microphone
    let stream
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Mic access requires HTTPS (or localhost)');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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

    // VAD + noise gate — wait for voice before recording
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)

    // Add lowpass filter to reduce hiss/hum
    const lowpass = audioContext.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = 4000
    source.connect(lowpass)
    lowpass.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const VOLUME_THRESHOLD = 50 // -50dB approximately
    const WAIT_TIME = 2000 // Stop 2s after speech ends

    // Wait for voice activity
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
            silenceTimer = setTimeout(() => {
              reject(new Error('No speech detected'))
            }, 10000) // 10s timeout
            requestAnimationFrame(checkVolume)
          }
        }
        
        checkVolume()
      })
    }

    // Start recording with VAD
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
      try { audioContext.close() } catch (e) {}
      setIsListening(false)

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

      // Try Groq first (faster, more reliable)
      if (apiKey) {
        try {
          const formData = new FormData()
          formData.append('file', audioBlob, 'audio.webm')
          formData.append('model', 'whisper-large-v3')
          formData.append('language', mapToGroqLanguage(language))

          const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: formData,
          })

          if (response.ok) {
            const data = await response.json()
            const text = data.text?.trim() || '';
            
            // If text is too short or looks like gibberish, retry once
            const isLowConfidence = text.length < 3 || 
              (text.length < 10 && /^[a-zA-Z\s]*$/.test(text) && !/[ऀ-ॿ০-৯]/.test(text));
            
            if (isLowConfidence) {
              // Silently retry - try local Whisper instead
              console.log('Low confidence STT, retrying with local Whisper');
              // Fall through to local Whisper
            } else {
              onResult?.(text, true);
              return;
            }
          }
        } catch {
          // Groq failed, fall through to local Whisper
        }
      }

      // Fallback: local transformers.js Whisper
      try {
        // Load model if needed
        if (!whisperPipeline) {
          setIsModelLoading(true)
          let loaded = false
          let attempts = 0
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

    // Start recording only after voice is detected
    try {
      await waitForVoice()
      mediaRecorder.start(1000)
      setIsListening(true)
    } catch {
      setSttError('No speech detected. Please try again.')
      onError?.('No speech detected')
      stream.getTracks().forEach(t => t.stop())
      try { audioContext.close() } catch (e) {}
      return
    }
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

  const speak = useCallback(async (text, language = 'hi') => {
    if (!text) return;

    // Try ElevenLabs first if configured
    if (isElevenLabsConfigured()) {
      try {
        const audioBuffer = await speakWithElevenLabs(text, language);
        // Convert ArrayBuffer to Audio and play
        const audioContext = new AudioContext();
        const audioBufferDecoded = await audioContext.decodeAudioData(audioBuffer);
        const audioSource = audioContext.createBufferSource();
        audioSource.buffer = audioBufferDecoded;
        audioSource.connect(audioContext.destination);
        audioSource.start(0);
        return;
      } catch (error) {
        console.warn('ElevenLabs TTS failed, falling back to browser TTS:', error);
        // Fall through to browser TTS
      }
    }

    // Browser TTS fallback
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = webSpeechSupported[language] || 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [])

  // Preload whisper model for whisper-only languages on mount
  useEffect(() => {
    if (!whisperPipeline && !whisperLoading) {
      setIsModelLoading(true)
      loadWhisper()
        .catch(() => {})
        .finally(() => setIsModelLoading(false))
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

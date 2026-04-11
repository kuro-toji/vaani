/**
 * Whisper STT Service - Fallback for browsers that block Web Speech API
 * Uses OpenAI Whisper API for transcription
 */

export async function transcribeAudio(audioBlob, languageHint = 'auto') {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: 'Whisper API key not configured. Add VITE_OPENAI_API_KEY to .env' };
  }

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    if (languageHint !== 'auto') {
      formData.append('language', mapToWhisperLanguage(languageHint));
    }

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json();
      return { success: false, error: err.error?.message || `API error ${response.status}` };
    }

    const data = await response.json();
    return { success: true, text: data.text };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function mapToWhisperLanguage(langCode) {
  // Whisper supports these languages: en, es, fr, de, it, pt, ru, ja, ko, zh, ar, hi, etc.
  const map = {
    hi: 'hi', bn: 'bn', te: 'te', ta: 'ta', mr: 'mr',
    ur: 'ur', gu: 'gu', kn: 'kn', ml: 'ml', pa: 'pa',
    or: 'or', ne: 'ne', as: 'as', en: 'en'
  };
  return map[langCode] || 'auto';
}

/**
 * Start MediaRecorder-based recording
 * Returns { audioBlob, stopRecording }
 */
export function startMediaRecording(onDataAvailable, onError) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    onError?.('MediaDevices API not supported');
    return null;
  }

  let mediaRecorder = null;
  let audioChunks = [];
  let stream = null;

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    audioChunks = [];
  };

  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(audioStream => {
      stream = audioStream;
      // Prefer webm/opus (Chrome) or audio/webm
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      
      mediaRecorder = new MediaRecorder(audioStream, { mimeType });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
          onDataAvailable?.(event.data);
        }
      };
      
      mediaRecorder.onerror = (e) => {
        onError?.(e.error?.message || 'Recording error');
        cleanup();
      };
      
      mediaRecorder.start(1000); // Collect data every 1 second
    })
    .catch(err => {
      onError?.(err.message);
    });

  return {
    stop: cleanup,
    getBlob: () => new Blob(audioChunks, { type: 'audio/webm' }),
  };
}

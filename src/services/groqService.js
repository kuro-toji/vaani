const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function transcribeWithGroq(audioData, language = 'hi') {
  const response = await fetch(`${API_BASE}/api/stt/transcribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audio: audioData, language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Transcription failed');
  }

  const data = await response.json();
  return data.text;
}

export default { transcribeWithGroq };
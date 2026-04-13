const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function detectLanguage(text) {
  if (!text || text.length < 2) {
    return 'hi';
  }

  // Check for Romanized Hindi patterns first
  const romanizedHindiPatterns = [
    /kya|kaisa|kaun|kyun|kaise|kaa/i,
    /hai|ho|hein|hain/i,
    /mai|mujhe|aap|tum|ham/i,
    /mera|mera|hamara|apna/i,
    /woh|yeh|uska|iska/i,
    /kar|raha|rahi|henge/i,
    /sakta|shayad|lekin|toh/i,
    /acha|bura|accha|haan|nahin/i,
    /rupees|rupiya|lakh|crore/i,
  ];

  for (const pattern of romanizedHindiPatterns) {
    if (pattern.test(text)) {
      return 'hi';
    }
  }

  // Check for Hindi Devanagari script
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }

  try {
    const response = await fetch(`${API_BASE}/api/detect/language`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      return 'hi';
    }

    const data = await response.json();
    return data.language || 'hi';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'hi'; // Default to Hindi
  }
}

export default { detectLanguage };
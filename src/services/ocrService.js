const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function scanPassbook(imageData) {
  const response = await fetch(`${API_BASE}/api/ocr/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageData, type: 'passbook' }),
  });

  if (!response.ok) {
    throw new Error('OCR scan failed');
  }

  return response.json();
}

/**
 * Alias for scanPassbook - maintains compatibility with existing code.
 */
export async function extractPassbookData(base64Image, mimeType = 'image/jpeg') {
  return scanPassbook(base64Image);
}

/**
 * Convert a File object to base64 string.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isMiniMaxConfigured() {
  return true; // Now checked on server side
}

export default { scanPassbook, extractPassbookData, fileToBase64, isMiniMaxConfigured };
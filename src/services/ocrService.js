/**
 * MiniMax OCR Service — Passbook Image Extraction
 * Uses MiniMax's OpenAI-compatible vision API to extract financial data
 * from bank passbook photos.
 */

const MINIMAX_BASE_URL = 'https://api.minimax.io/v1';

/**
 * Extract financial data from a passbook image using MiniMax Vision.
 * @param {string} base64Image - Base64-encoded image data (without prefix)
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns {Object} Extracted financial data
 */
export async function extractPassbookData(base64Image, mimeType = 'image/jpeg') {
  const apiKey = import.meta.env.VITE_MINIMAX_API_KEY;

  if (!apiKey) {
    throw new Error('MiniMax API key not configured. Set VITE_MINIMAX_API_KEY in .env');
  }

  const prompt = `You are a financial document extraction assistant. Analyze this bank passbook or bank statement image and extract the following information in JSON format:

{
  "accountHolder": "Name if visible",
  "bankName": "Bank name if visible",
  "accountNumber": "Account number (last 4 digits only for security)",
  "balance": "Current balance in INR (number only)",
  "recentTransactions": [
    { "date": "DD/MM/YYYY", "description": "Brief description", "amount": "number", "type": "credit/debit" }
  ],
  "accountType": "savings/current/fd/rd",
  "branch": "Branch name if visible"
}

Rules:
- Only extract what is clearly visible. Use null for unclear fields.
- For balance, return the latest/closing balance as a number.
- Return at most 5 recent transactions.
- Mask the account number to show only last 4 digits (e.g., "XXXX1234").
- If this is NOT a financial document, return { "error": "Not a financial document" }.
- Return ONLY valid JSON, no markdown.`;

  try {
    const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `MiniMax API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse financial data from image');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('MiniMax OCR error:', error);
    throw error;
  }
}

/**
 * Convert a File object to base64 string.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove data:image/...;base64, prefix
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isMiniMaxConfigured() {
  const apiKey = import.meta.env.VITE_MINIMAX_API_KEY;
  return apiKey && apiKey.length > 10;
}

export default { extractPassbookData, fileToBase64, isMiniMaxConfigured };

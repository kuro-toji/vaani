/**
 * OCR Service — Direct browser-to-MiniMax Vision API calls.
 *
 * Uses MiniMax-Text-01 vision model to extract financial data from
 * Indian bank passbook and statement images.
 */

const API_KEY = import.meta.env.VITE_MINIMAX_API_KEY || '';
const API_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

/**
 * Check if MiniMax API key is configured.
 */
export function isMiniMaxConfigured() {
  return !!(
    API_KEY &&
    API_KEY.length > 0 &&
    API_KEY !== 'your_minimax_api_key_here' &&
    API_KEY !== 'your_minimax_key_here'
  );
}

/**
 * Convert a File object to a base64 string.
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

/**
 * Strip markdown code fences from a string (```json ... ``` → inner content).
 */
function stripCodeFences(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

/**
 * Extract passbook/statement data from an image using MiniMax Vision API.
 *
 * @param {string} base64Image - Base64-encoded image data (no data: prefix)
 * @param {string} mimeType - MIME type of the image (default: image/jpeg)
 * @returns {Promise<Object>} Parsed passbook data object
 */
export async function extractPassbookData(base64Image, mimeType = 'image/jpeg') {
  if (!isMiniMaxConfigured()) {
    throw new Error('MiniMax API key सेट नहीं है। .env में VITE_MINIMAX_API_KEY जोड़ें।');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: 'text',
              text: 'This is an Indian bank passbook or bank statement image. Extract ALL financial information you can see. Return ONLY a valid JSON object with these fields: { "bankName": string, "accountNumber": string (last 4 digits only for security), "accountHolder": string, "balance": number (current balance in rupees as a number without commas), "transactions": array of { "date": string, "description": string, "amount": number, "type": "credit"|"debit" } (last 5 transactions only), "currency": "INR" }. If any field is not visible, set it to null. Return ONLY the JSON, no explanation, no markdown.',
            },
          ],
        },
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`पासबुक पढ़ने में समस्या (${response.status}): ${errText.substring(0, 100)}`);
  }

  const data = await response.json();

  // Extract the text content from MiniMax response
  const rawText =
    data?.choices?.[0]?.message?.content ||
    data?.reply ||
    data?.output?.text ||
    '';

  if (!rawText) {
    throw new Error('MiniMax से कोई जवाब नहीं आया। कृपया स्पष्ट फोटो लें।');
  }

  // Parse JSON from response (strip code fences if present)
  try {
    const cleaned = stripCodeFences(rawText);
    return JSON.parse(cleaned);
  } catch {
    throw new Error('पासबुक डेटा पढ़ने में समस्या। कृपया स्पष्ट फोटो अपलोड करें।');
  }
}

/**
 * Alias for backward compatibility.
 */
export async function scanPassbook(imageData) {
  return extractPassbookData(imageData);
}

/**
 * Format extracted passbook data into a readable Hindi summary.
 *
 * @param {Object} data - Parsed passbook data from extractPassbookData
 * @returns {string} Formatted summary string
 */
export function formatPassbookSummary(data) {
  let summary = `📊 पासबुक स्कैन:\n🏦 बैंक: ${data.bankName || 'अज्ञात'}\n💰 शेष: ₹${data.balance != null ? data.balance.toLocaleString('en-IN') : 'N/A'}\n👤 खाताधारक: ${data.accountHolder || 'N/A'}`;

  if (data.transactions && data.transactions.length > 0) {
    summary += '\n\nहाल के लेन-देन:';
    const recent = data.transactions.slice(0, 3);
    for (const txn of recent) {
      const sign = txn.type === 'credit' ? '+' : '-';
      const emoji = txn.type === 'credit' ? '🟢' : '🔴';
      summary += `\n${emoji} ${txn.date || ''} — ${txn.description || ''} ${sign}₹${txn.amount?.toLocaleString('en-IN') || '?'}`;
    }
  }

  return summary;
}

export default { scanPassbook, extractPassbookData, fileToBase64, isMiniMaxConfigured, formatPassbookSummary };
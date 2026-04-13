/**
 * ENCRYPTION DISCLAIMER - NOT FOR PRODUCTION
 * 
 * This implementation uses Base64 encoding which is NOT real encryption.
 * It provides OBSCURITY only, not security.
 * 
 * For production with real PII/financial data:
 * 1. Use Web Crypto API with AES-GCM
 * 2. Or better: never store sensitive data client-side
 * 3. Use a backend with proper encryption
 * 
 * This is acceptable for demo/prototype where:
 * - Data is not highly sensitive
 * - User explicitly opts in to local storage
 * - No compliance requirements (PDPA, GDPR, etc.)
 */

const ENCRYPTION_KEY = 'vaani-local-enc';

export function encryptData(data) {
  try {
    const str = JSON.stringify(data);
    // Simple base64 encoding (NOT real encryption)
    // For production, use Web Crypto API
    return btoa(encodeURIComponent(str));
  } catch {
    return null;
  }
}

export function decryptData(encrypted) {
  try {
    const str = decodeURIComponent(atob(encrypted));
    return JSON.parse(str);
  } catch {
    return null;
  }
}

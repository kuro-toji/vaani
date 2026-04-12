/**
 * Basic encryption for localStorage
 * Note: This is NOT military-grade encryption
 * For production, use Web Crypto API with proper key management
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

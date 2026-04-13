/**
 * Pincode Service — resolves Indian pincodes to region + language.
 * 
 * Strategy:
 * 1. Check local curated data (pincodes.js) — instant
 * 2. If not found, call free public API: api.postalpincode.in — covers all 150,000+ pincodes
 * 3. Cache results in sessionStorage for repeat lookups
 */

import { pincodeData, statePrefixes } from '../data/pincodes.js';
import { languages } from '../data/languages.js';

/* ── State → Language code mapping ── */
const STATE_LANGUAGE_MAP = {
  'Maharashtra': 'mr',
  'Tamil Nadu': 'ta',
  'West Bengal': 'bn',
  'Andhra Pradesh': 'te',
  'Telangana': 'te',
  'Karnataka': 'kn',
  'Kerala': 'ml',
  'Punjab': 'pa',
  'Gujarat': 'gu',
  'Odisha': 'or',
  'Assam': 'as',
  'Bihar': 'hi',
  'Uttar Pradesh': 'hi',
  'Rajasthan': 'hi',
  'Madhya Pradesh': 'hi',
  'Chhattisgarh': 'hi',
  'Jharkhand': 'hi',
  'Uttarakhand': 'hi',
  'Himachal Pradesh': 'hi',
  'Haryana': 'hi',
  'Delhi': 'hi',
  'Jammu and Kashmir': 'ks',
  'Jammu & Kashmir': 'ks',
  'Goa': 'kok',
  'Manipur': 'mni',
  'Meghalaya': 'hi',
  'Mizoram': 'hi',
  'Nagaland': 'hi',
  'Sikkim': 'ne',
  'Tripura': 'bn',
  'Arunachal Pradesh': 'hi',
  'Andaman and Nicobar Islands': 'hi',
  'Andaman and Nicobar': 'hi',
  'Dadra and Nagar Haveli and Daman and Diu': 'gu',
  'Dadra and Nagar Haveli': 'gu',
  'Daman and Diu': 'gu',
  'Lakshadweep': 'ml',
  'Puducherry': 'ta',
  'Chandigarh': 'pa',
  'Ladakh': 'hi',
};

/**
 * Get nativeName from languages data given a language code.
 */
function getNativeName(langCode) {
  const lang = languages.find(l => l.code === langCode);
  return lang?.nativeName || lang?.name || langCode;
}

/**
 * Normalize result from local data to standard format.
 */
function normalizeLocalResult(data) {
  // Local data has { region, language (name), state }
  // We need to find the language code from the name
  const lang = languages.find(l =>
    l.name.toLowerCase() === data.language.toLowerCase() ||
    l.nativeName === data.language
  );
  const langCode = lang?.code || STATE_LANGUAGE_MAP[data.state] || 'hi';

  return {
    region: data.region,
    state: data.state,
    language: langCode,
    languageName: getNativeName(langCode),
  };
}

/**
 * Check sessionStorage cache.
 */
function getCached(pincode) {
  try {
    const cached = sessionStorage.getItem(`vaani_pin_${pincode}`);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

/**
 * Save to sessionStorage cache.
 */
function setCache(pincode, result) {
  try {
    sessionStorage.setItem(`vaani_pin_${pincode}`, JSON.stringify(result));
  } catch {}
}

/**
 * Resolve a 6-digit Indian pincode to region + language.
 * 
 * @param {string} pincode - 6-digit Indian pincode
 * @returns {Promise<{region: string, state: string, language: string, languageName: string} | null>}
 */
export async function getRegionByPincode(pincode) {
  if (!pincode) return null;

  const normalized = String(pincode).trim();
  if (normalized.length !== 6 || !/^\d{6}$/.test(normalized)) return null;

  // 1. Check sessionStorage cache
  const cached = getCached(normalized);
  if (cached) return cached;

  // 2. Check local curated pincode data
  if (pincodeData[normalized]) {
    const result = normalizeLocalResult(pincodeData[normalized]);
    setCache(normalized, result);
    return result;
  }

  // 3. Fuzzy match — first 3 digits against curated list
  const prefix3 = normalized.substring(0, 3);
  for (const [key, value] of Object.entries(pincodeData)) {
    if (key.startsWith(prefix3)) {
      const result = normalizeLocalResult(value);
      setCache(normalized, result);
      return result;
    }
  }

  // 4. Call free public API for full coverage
  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${normalized}`);
    if (response.ok) {
      const data = await response.json();

      if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const district = po.District || po.Name || 'Unknown';
        const state = po.State || 'Unknown';
        const langCode = STATE_LANGUAGE_MAP[state] || 'hi';

        const result = {
          region: district,
          state: state,
          language: langCode,
          languageName: getNativeName(langCode),
        };

        setCache(normalized, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Pincode API fetch failed:', err);
  }

  // 5. Last resort: 2-digit state prefix mapping
  const prefix2 = normalized.substring(0, 2);
  if (statePrefixes[prefix2]) {
    const result = normalizeLocalResult(statePrefixes[prefix2]);
    setCache(normalized, result);
    return result;
  }

  // Fallback
  const fallback = {
    region: 'India',
    state: 'Unknown',
    language: 'hi',
    languageName: 'हिन्दी',
  };
  setCache(normalized, fallback);
  return fallback;
}

/**
 * Search for pincode data by location name (city, district, or area).
 * Checks cache and API as fallback.
 */
export async function searchByLocationName(locationName) {
  if (!locationName || locationName.length < 2) return null;
  const name = locationName.toLowerCase().trim();

  // Check cache first
  try {
    const cached = sessionStorage.getItem(`vaani_loc_${name}`);
    if (cached) return JSON.parse(cached);
  } catch {}

  try {
    const response = await fetch(
      `https://api.postalpincode.in/postoffice/${encodeURIComponent(locationName)}`,
      { signal: AbortSignal.timeout(4000) }
    );
    const data = await response.json();
    if (data?.[0]?.Status === 'Success' && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      const result = { pincode: po.Pincode?.toString() || '', region: po.District, state: po.State };
      try { sessionStorage.setItem(`vaani_loc_${name}`, JSON.stringify(result)); } catch {}
      return result;
    }
  } catch {}
  return null;
}

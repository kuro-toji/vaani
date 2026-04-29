// ═══════════════════════════════════════════════════════════════════
// VAANI AMFI Service — Fetch SIP/NAV from official AMFI India API
// API: https://api.mfapi.in/mf — Free, no API key, 10,000+ funds
// ═══════════════════════════════════════════════════════════════════

const AMFI_API_BASE = 'https://api.mfapi.in/mf';

// Cache for fund list (refreshes every hour)
let fundListCache = null;
let fundListCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000;

// ─── Fetch All Funds ─────────────────────────────────────────────
export async function fetchAllFunds() {
  const now = Date.now();
  
  // Return cached list if still valid
  if (fundListCache && (now - fundListCacheTime) < CACHE_DURATION) {
    return fundListCache;
  }
  
  try {
    const response = await fetch(`${AMFI_API_BASE}`);
    if (!response.ok) throw new Error('Failed to fetch funds');
    const data = await response.json();
    
    fundListCache = data;
    fundListCacheTime = now;
    
    return data.sort((a, b) => a.schemeName.localeCompare(b.schemeName));
  } catch (error) {
    console.error('[AMFI] Error fetching funds:', error);
    return [];
  }
}

// ─── Fetch NAV by Scheme Code ───────────────────────────────────
export async function fetchNavByCode(schemeCode) {
  try {
    const response = await fetch(`${AMFI_API_BASE}/${schemeCode}`);
    if (!response.ok) throw new Error('Failed to fetch NAV');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[AMFI] Error fetching NAV:', error);
    return null;
  }
}

// ─── Get Latest NAV for a Fund ──────────────────────────────────
export async function getLatestNAV(schemeCode) {
  const data = await fetchNavByCode(schemeCode);
  if (!data || !data.data || data.data.length === 0) return null;
  
  return {
    nav: parseFloat(data.data[0].nav),
    date: data.data[0].repDt,
  };
}

// ─── Search Funds by Name ────────────────────────────────────────
export async function searchFunds(query) {
  if (!query || query.length < 2) return [];
  
  const funds = await fetchAllFunds();
  const lowerQuery = query.toLowerCase();
  
  return funds.filter(fund => 
    fund.schemeName.toLowerCase().includes(lowerQuery)
  ).slice(0, 20);
}

// ─── Get Top Funds by Category ───────────────────────────────────
export async function getTopFundsByCategory(category, limit = 5) {
  const funds = await fetchAllFunds();
  const filtered = funds.filter(f => 
    f.schemeName.toLowerCase().includes(category.toLowerCase())
  );
  
  const results = [];
  
  for (const fund of filtered.slice(0, limit * 2)) {
    const navData = await fetchNavByCode(fund.schemeCode);
    if (navData && navData.data && navData.data[0]?.nav) {
      results.push({
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        nav: parseFloat(navData.data[0].nav),
        date: navData.data[0].repDt,
      });
      if (results.length >= limit) break;
    }
  }
  
  return results;
}

// ─── Get Popular SIP Funds (Large Cap) ───────────────────────────
export async function getPopularSIPFunds() {
  const popularCodes = [
    119938, // HDFC Top 100
    101714, // SBI Bluechip
    101725, // ICICI Pru Bluechip
    100023, // Axis Bluechip
    119837, // Mirae Asset Large Cap
  ];
  
  const results = [];
  
  for (const code of popularCodes) {
    const navData = await fetchNavByCode(code);
    if (navData && navData.meta) {
      results.push({
        schemeCode: code,
        schemeName: navData.meta.schemeName,
        nav: parseFloat(navData.data?.[0]?.nav || 0),
        date: navData.data?.[0]?.repDt,
      });
    }
  }
  
  return results;
}

// ─── Format Fund Name for Display ────────────────────────────────
export function formatFundName(name) {
  const parts = name.split(' - ');
  if (parts.length >= 2) {
    return parts.slice(0, 2).join(' - ');
  }
  return name;
}

export default {
  fetchAllFunds,
  fetchNavByCode,
  getLatestNAV,
  searchFunds,
  getTopFundsByCategory,
  getPopularSIPFunds,
  formatFundName,
};
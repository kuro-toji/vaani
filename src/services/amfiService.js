// ═══════════════════════════════════════════════════════════════════
// VAANI AMFI Service — Fetch SIP/NAV from official AMFI India API
// API: https://api.mfapi.in/mf — Free, no API key, 10,000+ funds
// FIXED: Deduplicate funds, filter Direct plans
// ═══════════════════════════════════════════════════════════════════

const AMFI_API_BASE = 'https://api.mfapi.in/mf';

// Cache for fund list
let fundListCache = null;
let fundListCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// ─── Fetch All Funds ─────────────────────────────────────────────
export async function fetchAllFunds() {
  const now = Date.now();
  
  if (fundListCache && (now - fundListCacheTime) < CACHE_DURATION) {
    return fundListCache;
  }
  
  try {
    const response = await fetch(`${AMFI_API_BASE}`);
    if (!response.ok) throw new Error('Failed to fetch funds');
    const data = await response.json();
    
    // Filter out duplicates and Direct plans
    const filtered = data.filter(f => {
      const name = (f.schemeName || '').toLowerCase();
      // Only keep Regular plans (exclude Direct plans)
      // Keep only first occurrence of each scheme base name
      return !name.includes('direct plan');
    });
    
    // Deduplicate by normalized name
    const seen = new Set();
    const unique = filtered.filter(f => {
      const baseName = getBaseName(f.schemeName);
      if (seen.has(baseName)) return false;
      seen.add(baseName);
      return true;
    });
    
    fundListCache = unique;
    fundListCacheTime = now;
    console.log('[AMFI] Fetched', data.length, 'funds, filtered to', unique.length, 'unique regular plans');
    
    return unique.sort((a, b) => a.schemeName.localeCompare(b.schemeName));
  } catch (error) {
    console.error('[AMFI] Error fetching funds:', error);
    return [];
  }
}

// ─── Get Base Name (remove Regular/Growth/Dividend suffixes) ────
function getBaseName(name) {
  if (!name) return '';
  return name
    .replace(/\s*-\s*Regular\s*/gi, ' - ')
    .replace(/\s*-\s*Growth\s*/gi, '')
    .replace(/\s*-\s*Dividend\s*/gi, '')
    .replace(/\s*Direct\s*/gi, '')
    .trim()
    .toLowerCase();
}

// ─── Fetch NAV by Scheme Code ───────────────────────────────────
export async function fetchNavByCode(schemeCode) {
  try {
    const response = await fetch(`${AMFI_API_BASE}/${schemeCode}`);
    if (!response.ok) throw new Error('Failed to fetch NAV');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[AMFI] Error fetching NAV for code', schemeCode, ':', error);
    return null;
  }
}

// ─── Get Latest NAV for a Fund ──────────────────────────────────
export async function getLatestNAV(schemeCode) {
  const data = await fetchNavByCode(schemeCode);
  if (!data || !data.data || data.data.length === 0) return null;
  
  // Find first entry with valid NAV
  for (const entry of data.data) {
    if (entry.nav && parseFloat(entry.nav) > 0) {
      return {
        nav: parseFloat(entry.nav),
        date: entry.date || entry.repDt,
      };
    }
  }
  
  return null;
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

// ─── Get Top Funds by Category ──────────────────────────────────
export async function getTopFundsByCategory(category, limit = 5) {
  const funds = await fetchAllFunds();
  const filtered = funds.filter(f => 
    f.schemeName.toLowerCase().includes(category.toLowerCase())
  );
  
  const results = [];
  
  for (const fund of filtered.slice(0, limit * 2)) {
    const navData = await fetchNavByCode(fund.schemeCode);
    if (navData && navData.data && navData.data[0]?.nav && parseFloat(navData.data[0].nav) > 0) {
      results.push({
        schemeCode: fund.schemeCode,
        schemeName: navData.meta?.schemeName || fund.schemeName,
        nav: parseFloat(navData.data[0].nav),
        date: navData.data[0].date || navData.data[0].repDt,
      });
      if (results.length >= limit) break;
    }
  }
  
  return results;
}

// ─── Get Popular SIP Funds (Large Cap) ───────────────────────────
export async function getPopularSIPFunds() {
  const funds = await fetchAllFunds();
  
  // Search for large cap equity funds (Regular plans only)
  const largeCapSearchTerms = ['large cap', 'blue chip', 'top 100', 'flexi cap', 'focus equity'];
  
  let largeCapFunds = [];
  for (const term of largeCapSearchTerms) {
    const found = funds.filter(f => 
      f.schemeName.toLowerCase().includes(term)
    );
    largeCapFunds = [...largeCapFunds, ...found];
  }
  
  // Remove duplicates by base name
  const seen = new Set();
  const uniqueFunds = largeCapFunds.filter(f => {
    const base = getBaseName(f.schemeName);
    if (seen.has(base)) return false;
    seen.add(base);
    return true;
  }).slice(0, 10);
  
  const results = [];
  
  for (const fund of uniqueFunds) {
    try {
      const navData = await fetchNavByCode(fund.schemeCode);
      if (navData && navData.data && navData.data[0]?.nav) {
        const nav = parseFloat(navData.data[0].nav);
        if (nav > 0) {
          results.push({
            schemeCode: fund.schemeCode,
            schemeName: formatFundName(navData.meta?.schemeName || fund.schemeName),
            nav: nav,
            date: navData.data[0].date || navData.data[0].repDt,
          });
          if (results.length >= 5) break;
        }
      }
    } catch (e) {
      console.log('[AMFI] Skipping fund', fund.schemeCode, 'due to error');
    }
  }
  
  console.log('[AMFI] Found', results.length, 'valid SIP funds (deduplicated)');
  return results;
}

// ─── Format Fund Name for Display ────────────────────────────────
export function formatFundName(name) {
  if (!name) return '';
  
  // Remove common suffixes
  let formatted = name
    .replace(/\s*-\s*Regular\s*/gi, ' - ')
    .replace(/\s*-\s*Growth\s*/gi, '')
    .replace(/\s*-\s*Dividend\s*/gi, '')
    .replace(/\s*Direct\s*/gi, '')
    .replace(/\s*Monthly\s*/gi, '')
    .replace(/\s*Half-Yearly\s*/gi, '')
    .trim();
  
  // Shorten if too long
  if (formatted.length > 40) {
    formatted = formatted.split(' - ')[0] || formatted;
  }
  
  return formatted;
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
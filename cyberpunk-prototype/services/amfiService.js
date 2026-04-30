// ═══════════════════════════════════════════════════════════════════
// VAANI AMFI Service — Fetch SIP/NAV from official AMFI India API
// API: https://api.mfapi.in/mf — Free, no API key, 10,000+ funds
// LIVE DATA: Fetches real NAV from AMFI India every request
// ═══════════════════════════════════════════════════════════════════

const AMFI_API_BASE = 'https://api.mfapi.in/mf';
const SUPABASE_URL = 'https://dqdievbkvakaptxhzxft.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZGlldmJrdmFrYXB0eGh6eGZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDQxNjMsImV4cCI6MjA5MzAyMDE2M30.J-bBpt8Dy9QQoXlWufDo95uT7kmdMwOca_pg7saDKLI';

// Cache for fund list
let fundListCache = null;
let fundListCacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// ─── Popular Fund Codes (hardcoded for speed) ─────────────────────
const POPULAR_FUNDS = [
  { code: 134336, name: 'HDFC Focused Equity', house: 'HDFC' },
  { code: 108467, name: 'ICICI Bluechip', house: 'ICICI' },
  { code: 118826, name: 'Mirae Large Cap', house: 'Mirae' },
  { code: 140813, name: 'Groww Largecap', house: 'Groww' },
  { code: 154154, name: 'Parag Parikh Large Cap', house: 'PPFAS' },
];

// ─── Sync to Supabase ─────────────────────────────────────────────
async function syncToSupabase(funds) {
  try {
    for (const fund of funds) {
      // Use upsert with unique scheme_code
      const payload = {
        scheme_code: String(fund.code),
        scheme_name: fund.name,
        nav: parseFloat(fund.nav) || 0,
        nav_date: fund.date,
        updated_at: new Date().toISOString()
      };
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/nav_cache`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok && response.status !== 409) {
        console.warn('[AMFI] Sync warning for fund', fund.code, response.status);
      }
    }
    console.log('[AMFI] Synced', funds.length, 'funds to Supabase');
  } catch (e) {
    console.warn('[AMFI] Supabase sync failed (non-critical):', e.message);
  }
}

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

async function fetchNavLive(code) {
  try {
    const response = await fetch(`${AMFI_API_BASE}/${code}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.data || data.data.length === 0) return null;
    return {
      nav: parseFloat(data.data[0].nav),
      date: data.data[0].date,
      name: data.meta?.scheme_name || 'Unknown',
    };
  } catch (e) {
    return null;
  }
}

// ─── Get Popular SIP Funds (LIVE from AMFI API) ───────────────────
export async function getPopularSIPFunds() {
  // Fetch NAV for popular funds directly from AMFI API
  const results = [];
  const supabaseResults = [];
  
  for (const fund of POPULAR_FUNDS) {
    const navData = await fetchNavLive(fund.code);
    if (navData && navData.nav > 0) {
      results.push({
        schemeCode: fund.code,
        schemeName: navData.name,
        nav: navData.nav,
        date: navData.date,
      });
      supabaseResults.push({ code: fund.code, name: fund.name, nav: navData.nav, date: navData.date });
    }
  }
  
  // Sync to Supabase in background
  if (supabaseResults.length > 0) {
    syncToSupabase(supabaseResults).catch(() => {});
  }
  
  console.log('[AMFI] Live NAV fetched for', results.length, 'funds');
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
// ═══════════════════════════════════════════════════════════════════
// VAANI FD Rates Service — Fetch FD rates from Supabase DB
// LIVE DATA: Fetched from Supabase tables (updated by cron job)
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dqdievbkvakaptxhzxft.supabase.co';

// ─── Supported Banks with Real FD Rates ─────────────────────────
export const FD_BANKS = [
  { id: 'sbi', name: 'State Bank of India', short: 'SBI' },
  { id: 'hdfc', name: 'HDFC Bank', short: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', short: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', short: 'Axis' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', short: 'Kotak' },
  { id: 'yes', name: 'Yes Bank', short: 'Yes' },
  { id: 'pnb', name: 'Punjab National Bank', short: 'PNB' },
  { id: 'bob', name: 'Bank of Baroda', short: 'BoB' },
];

// ─── Real FD Rates from Supabase (fallback defaults) ───────────────
// These are current April 2026 rates for 1 Year tenure
export const FD_RATES = {
  sbi: {
    name: 'State Bank of India',
    tenures: { '1y': 6.80 },
  },
  bob: {
    name: 'Bank of Baroda',
    tenures: { '1y': 6.85 },
  },
  hdfc: {
    name: 'HDFC Bank',
    tenures: { '1y': 7.10 },
  },
  icici: {
    name: 'ICICI Bank',
    tenures: { '1y': 7.10 },
  },
  axis: {
    name: 'Axis Bank',
    tenures: { '1y': 7.10 },
  },
  yes: {
    name: 'Yes Bank',
    tenures: { '1y': 7.75 },
  },
  kotak: {
    name: 'Kotak Mahindra Bank',
    tenures: { '1y': 6.20 },
  },
  indus: {
    name: 'IndusInd Bank',
    tenures: { '1y': 7.99 },
  },
  Suryoday: {
    name: 'Suryoday Small Finance Bank',
    tenures: { '1y': 9.10 },
  },
  utkarsh: {
    name: 'Utkarsh Small Finance Bank',
    tenures: { '1y': 8.50 },
  },
  au: {
    name: 'AU Small Finance Bank',
    tenures: { '1y': 8.00 },
  },
};

// ─── Tenure Labels ───────────────────────────────────────────────
const TENURE_LABELS = {
  '1y': '1 Year',
  '2y': '2 Years',
  '3y': '3 Years',
  '5y': '5 Years',
};

// ─── Get All FD Rates ────────────────────────────────────────────
export function getAllFDRates() {
  const rates = [];
  
  for (const [bankId, bankData] of Object.entries(FD_RATES)) {
    for (const [tenure, rate] of Object.entries(bankData.tenures)) {
      rates.push({
        bankId,
        bankName: bankData.name,
        tenure,
        tenureLabel: TENURE_LABELS[tenure] || tenure,
        rate,
        seniorRate: rate + 0.5,
        minAmount: 1000,
      });
    }
  }
  
  return rates.sort((a, b) => b.rate - a.rate);
}

// ─── Get Best FD Rates ──────────────────────────────────────────
export function getBestFDRates(tenure, isSenior = false, limit = 10) {
  const all = getAllFDRates();
  
  const filtered = all
    .filter(r => !tenure || r.tenure === tenure)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, limit);
  
  return filtered.map(r => ({
    ...r,
    displayRate: isSenior ? r.seniorRate : r.rate,
  }));
}

// ─── Get FD by Bank ─────────────────────────────────────────────
export function getFDByBank(bankId) {
  const bankData = FD_RATES[bankId];
  if (!bankData) return [];
  
  return Object.entries(bankData.tenures).map(([tenure, rate]) => ({
    bankId,
    bankName: bankData.name,
    tenure,
    tenureLabel: TENURE_LABELS[tenure] || tenure,
    rate,
    seniorRate: rate + 0.5,
    minAmount: 1000,
  }));
}

// ─── Calculate FD Maturity ───────────────────────────────────────
export function calculateFDMaturity(principal, rate, tenureYears, compoundFrequency = 'quarterly') {
  const n = compoundFrequency === 'monthly' ? 12 
    : compoundFrequency === 'yearly' ? 1 
    : 4; // quarterly
  const t = tenureYears;
  const r = rate / 100;
  
  // A = P(1 + r/n)^(nt)
  const maturityValue = principal * Math.pow(1 + r / n, n * t);
  const totalInterest = maturityValue - principal;
  
  // TDS: 10% if interest > 40k/year, 20% if > 80k/year
  const yearlyInterest = totalInterest / t;
  let tds = 0;
  if (yearlyInterest > 40000) {
    tds = yearlyInterest > 80000 ? totalInterest * 0.2 : totalInterest * 0.1;
  }
  
  return {
    principal,
    rate,
    tenureYears,
    maturityValue: Math.round(maturityValue),
    totalInterest: Math.round(totalInterest),
    tds: Math.round(tds),
    netMaturity: Math.round(maturityValue - tds),
  };
}

// ─── Format FD Rate ─────────────────────────────────────────────
export function formatFDRate(rate) {
  return `${rate.toFixed(2)}%`;
}

// ─── Fetch FD Rates from Supabase API ──────────────────────────────
let cachedFDRates = null;
let fdRatesCacheTime = 0;
const FD_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export async function fetchFDRatesFromAPI(tenure = '1 Year') {
  const now = Date.now();
  
  // Return cached if fresh
  if (cachedFDRates && (now - fdRatesCacheTime) < FD_CACHE_DURATION) {
    return cachedFDRates;
  }
  
  try {
    // Fetch from /api/market/fd-rates endpoint
    const response = await fetch(`/api/market/fd-rates?tenure=${encodeURIComponent(tenure)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.rates && data.rates.length > 0) {
        cachedFDRates = data.rates;
        fdRatesCacheTime = now;
        return cachedFDRates;
      }
    }
  } catch (e) {
    console.warn('[FDRates] API fetch failed, using fallback:', e.message);
  }
  
  // Fallback: use static FD_RATES
  return getAllFDRates();
}

// ─── Get Top FDs for Dashboard (from API or fallback) ──────────────
export async function getTopFDs() {
  try {
    const rates = await fetchFDRatesFromAPI('1 Year');
    return rates.slice(0, 4).map(fd => ({
      bankId: fd.bank_name || fd.bankId,
      bankName: fd.bank_name || fd.bankName,
      tenure: tenureToKey(fd.tenure_label),
      tenureLabel: fd.tenure_label,
      rate: fd.display_rate || fd.rate,
      seniorRate: fd.senior_rate,
      displayRate: fd.display_rate || fd.rate,
      minAmount: 1000,
    }));
  } catch (e) {
    // Ultimate fallback to static data
    return getBestFDRates('1y', false, 4);
  }
}

// Helper: tenure label to key
function tenureToKey(label) {
  if (label?.includes('1 Year')) return '1y';
  if (label?.includes('2 Year')) return '2y';
  if (label?.includes('3 Year')) return '3y';
  if (label?.includes('5 Year')) return '5y';
  return '1y';
}

export default {
  FD_BANKS,
  FD_RATES,
  getAllFDRates,
  getBestFDRates,
  getFDByBank,
  calculateFDMaturity,
  formatFDRate,
  getTopFDs,
};
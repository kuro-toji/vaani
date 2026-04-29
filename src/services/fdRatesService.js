// ═══════════════════════════════════════════════════════════════════
// VAANI FD Rates Service — Fetch FD rates from Indian banks
// Static data with real rates updated manually
// ═══════════════════════════════════════════════════════════════════

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

// ─── Current FD Rates (as of April 2025) ─────────────────────────
// Rates for general public, senior citizens get +0.5%
export const FD_RATES = {
  sbi: {
    name: 'State Bank of India',
    tenures: {
      '1y': 5.10,
      '2y': 5.10,
      '3y': 5.10,
      '5y': 5.10,
    },
  },
  hdfc: {
    name: 'HDFC Bank',
    tenures: {
      '1y': 5.15,
      '2y': 5.15,
      '3y': 5.30,
      '5y': 5.40,
    },
  },
  icici: {
    name: 'ICICI Bank',
    tenures: {
      '1y': 5.15,
      '2y': 5.15,
      '3y': 5.25,
      '5y': 5.35,
    },
  },
  axis: {
    name: 'Axis Bank',
    tenures: {
      '1y': 5.25,
      '2y': 5.25,
      '3y': 5.40,
      '5y': 5.50,
    },
  },
  kotak: {
    name: 'Kotak Mahindra Bank',
    tenures: {
      '1y': 5.20,
      '2y': 5.20,
      '3y': 5.30,
      '5y': 5.40,
    },
  },
  yes: {
    name: 'Yes Bank',
    tenures: {
      '1y': 5.50,
      '2y': 5.50,
      '3y': 5.50,
      '5y': 5.50,
    },
  },
  pnb: {
    name: 'Punjab National Bank',
    tenures: {
      '1y': 5.00,
      '2y': 5.00,
      '3y': 5.00,
      '5y': 5.00,
    },
  },
  bob: {
    name: 'Bank of Baroda',
    tenures: {
      '1y': 5.05,
      '2y': 5.05,
      '3y': 5.05,
      '5y': 5.05,
    },
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

// ─── Get Top 3 FDs for Dashboard ───────────────────────────────
export function getTopFDs() {
  return getBestFDRates('1y', false, 3);
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
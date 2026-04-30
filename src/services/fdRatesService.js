// ═══════════════════════════════════════════════════════════════════
// VAANI FD Rates Service v2 — Production Grade
// Comprehensive bank data with multi-tenure rates, types, features
// ═══════════════════════════════════════════════════════════════════

// ─── Complete Bank Database ──────────────────────────────────────
export const BANKS = [
  // Public Sector Banks
  {
    id: 'sbi', name: 'State Bank of India', short: 'SBI', type: 'psu', logo: '🏛️',
    features: ['DICGC ₹5L insured', 'Doorstep banking', 'Loan against FD', 'Online renewal'],
    minDeposit: 1000, prematureWithdrawal: 'Yes (1% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 3.50, senior: 4.00 }, '14d': { general: 3.50, senior: 4.00 },
      '30d': { general: 4.50, senior: 5.00 }, '45d': { general: 4.50, senior: 5.00 },
      '90d': { general: 5.50, senior: 6.00 }, '180d': { general: 6.50, senior: 7.00 },
      '1y': { general: 6.80, senior: 7.30 }, '2y': { general: 7.00, senior: 7.50 },
      '3y': { general: 6.75, senior: 7.25 }, '5y': { general: 6.50, senior: 7.00 },
    },
  },
  {
    id: 'bob', name: 'Bank of Baroda', short: 'BoB', type: 'psu', logo: '🏛️',
    features: ['DICGC ₹5L insured', 'E-FD facility', 'Auto-renewal', 'Baroda Connect'],
    minDeposit: 1000, prematureWithdrawal: 'Yes (1% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 3.00, senior: 3.50 }, '30d': { general: 4.50, senior: 5.00 },
      '90d': { general: 5.75, senior: 6.25 }, '180d': { general: 6.50, senior: 7.00 },
      '1y': { general: 6.85, senior: 7.35 }, '2y': { general: 7.15, senior: 7.65 },
      '3y': { general: 7.00, senior: 7.50 }, '5y': { general: 6.50, senior: 7.00 },
    },
  },
  {
    id: 'pnb', name: 'Punjab National Bank', short: 'PNB', type: 'psu', logo: '🏛️',
    features: ['DICGC ₹5L insured', 'PNB One app', 'Overdraft on FD', 'Multi-city cheque'],
    minDeposit: 1000, prematureWithdrawal: 'Yes (1% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 3.50, senior: 4.00 }, '30d': { general: 4.50, senior: 5.00 },
      '90d': { general: 5.50, senior: 6.00 }, '180d': { general: 6.50, senior: 7.00 },
      '1y': { general: 6.80, senior: 7.30 }, '2y': { general: 7.00, senior: 7.50 },
      '3y': { general: 6.75, senior: 7.25 }, '5y': { general: 6.50, senior: 7.00 },
    },
  },
  {
    id: 'canara', name: 'Canara Bank', short: 'Canara', type: 'psu', logo: '🏛️',
    features: ['DICGC ₹5L insured', 'Canara ai1 app', 'Special rates for staff'],
    minDeposit: 1000, prematureWithdrawal: 'Yes (1% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 3.25, senior: 3.75 }, '30d': { general: 4.50, senior: 5.00 },
      '90d': { general: 5.50, senior: 6.00 }, '180d': { general: 6.50, senior: 7.00 },
      '1y': { general: 6.85, senior: 7.35 }, '2y': { general: 7.00, senior: 7.50 },
      '3y': { general: 6.80, senior: 7.30 }, '5y': { general: 6.50, senior: 7.00 },
    },
  },
  // Private Banks
  {
    id: 'hdfc', name: 'HDFC Bank', short: 'HDFC', type: 'private', logo: '🏦',
    features: ['DICGC ₹5L insured', 'Online FD in 3 min', 'Sweep-in facility', 'NetBanking renewal'],
    minDeposit: 5000, prematureWithdrawal: 'Yes (1% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 3.50, senior: 4.00 }, '30d': { general: 4.75, senior: 5.25 },
      '90d': { general: 6.00, senior: 6.50 }, '180d': { general: 6.75, senior: 7.25 },
      '1y': { general: 7.10, senior: 7.60 }, '2y': { general: 7.20, senior: 7.70 },
      '3y': { general: 7.00, senior: 7.50 }, '5y': { general: 7.00, senior: 7.50 },
    },
  },
  {
    id: 'icici', name: 'ICICI Bank', short: 'ICICI', type: 'private', logo: '🏦',
    features: ['DICGC ₹5L insured', 'iMobile Pay FD', 'FD-linked debit card', 'Auto-sweep'],
    minDeposit: 10000, prematureWithdrawal: 'Yes (0.5-1% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 3.00, senior: 3.50 }, '30d': { general: 4.75, senior: 5.25 },
      '90d': { general: 6.00, senior: 6.50 }, '180d': { general: 6.75, senior: 7.25 },
      '1y': { general: 7.10, senior: 7.60 }, '2y': { general: 7.20, senior: 7.70 },
      '3y': { general: 7.00, senior: 7.50 }, '5y': { general: 7.00, senior: 7.50 },
    },
  },
  {
    id: 'axis', name: 'Axis Bank', short: 'Axis', type: 'private', logo: '🏦',
    features: ['DICGC ₹5L insured', 'Express FD', 'Priority banking rates', 'Loan @ 90%'],
    minDeposit: 5000, prematureWithdrawal: 'Yes (1% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 3.50, senior: 4.00 }, '30d': { general: 5.75, senior: 6.25 },
      '90d': { general: 6.00, senior: 6.50 }, '180d': { general: 6.75, senior: 7.25 },
      '1y': { general: 7.10, senior: 7.60 }, '2y': { general: 7.26, senior: 7.76 },
      '3y': { general: 7.10, senior: 7.60 }, '5y': { general: 7.00, senior: 7.50 },
    },
  },
  {
    id: 'kotak', name: 'Kotak Mahindra Bank', short: 'Kotak', type: 'private', logo: '🏦',
    features: ['DICGC ₹5L insured', 'Kotak 811 digital FD', 'Instant liquidation'],
    minDeposit: 5000, prematureWithdrawal: 'Yes (0.5% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 3.25, senior: 3.75 }, '30d': { general: 4.75, senior: 5.25 },
      '90d': { general: 5.75, senior: 6.25 }, '180d': { general: 6.50, senior: 7.00 },
      '1y': { general: 7.40, senior: 7.90 }, '2y': { general: 7.20, senior: 7.70 },
      '3y': { general: 7.10, senior: 7.60 }, '5y': { general: 6.20, senior: 6.70 },
    },
  },
  // High-Yield Private
  {
    id: 'yes', name: 'Yes Bank', short: 'Yes', type: 'private', logo: '💰',
    features: ['DICGC ₹5L insured', 'Yes Premia rates', 'Yes mobile FD', 'Partial withdrawal'],
    minDeposit: 10000, prematureWithdrawal: 'Yes (1% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 3.25, senior: 3.75 }, '30d': { general: 5.00, senior: 5.50 },
      '90d': { general: 6.25, senior: 6.75 }, '180d': { general: 7.25, senior: 7.75 },
      '1y': { general: 7.75, senior: 8.25 }, '2y': { general: 7.75, senior: 8.25 },
      '3y': { general: 7.25, senior: 7.75 }, '5y': { general: 7.25, senior: 7.75 },
    },
  },
  {
    id: 'indusind', name: 'IndusInd Bank', short: 'IndusInd', type: 'private', logo: '💰',
    features: ['DICGC ₹5L insured', 'IndusFD Flexi', 'Non-callable option', 'Online premature'],
    minDeposit: 10000, prematureWithdrawal: 'Yes', taxSaver: true,
    tenures: {
      '7d': { general: 4.00, senior: 4.50 }, '30d': { general: 6.00, senior: 6.50 },
      '90d': { general: 7.00, senior: 7.50 }, '180d': { general: 7.50, senior: 8.00 },
      '1y': { general: 7.99, senior: 8.49 }, '2y': { general: 7.75, senior: 8.25 },
      '3y': { general: 7.25, senior: 7.75 }, '5y': { general: 7.25, senior: 7.75 },
    },
  },
  // Small Finance Banks (Highest Rates)
  {
    id: 'suryoday', name: 'Suryoday Small Finance Bank', short: 'Suryoday SFB', type: 'sfb', logo: '🌟',
    features: ['DICGC ₹5L insured', 'Highest FD rates in India', 'Online FD', 'No lock-in'],
    minDeposit: 5000, prematureWithdrawal: 'Yes (1% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 4.00, senior: 4.50 }, '30d': { general: 6.00, senior: 6.50 },
      '90d': { general: 7.00, senior: 7.50 }, '180d': { general: 8.00, senior: 8.50 },
      '1y': { general: 9.10, senior: 9.60 }, '2y': { general: 8.60, senior: 9.10 },
      '3y': { general: 8.25, senior: 8.75 }, '5y': { general: 7.50, senior: 8.00 },
    },
  },
  {
    id: 'utkarsh', name: 'Utkarsh Small Finance Bank', short: 'Utkarsh SFB', type: 'sfb', logo: '🌟',
    features: ['DICGC ₹5L insured', 'High rates', 'Loan against FD', 'Digital banking'],
    minDeposit: 1000, prematureWithdrawal: 'Yes', taxSaver: true,
    tenures: {
      '7d': { general: 4.50, senior: 5.00 }, '30d': { general: 6.00, senior: 6.50 },
      '90d': { general: 7.00, senior: 7.50 }, '180d': { general: 7.75, senior: 8.25 },
      '1y': { general: 8.50, senior: 9.00 }, '2y': { general: 8.25, senior: 8.75 },
      '3y': { general: 8.00, senior: 8.50 }, '5y': { general: 7.50, senior: 8.00 },
    },
  },
  {
    id: 'au', name: 'AU Small Finance Bank', short: 'AU SFB', type: 'sfb', logo: '🌟',
    features: ['DICGC ₹5L insured', 'AU 0101 digital', 'Video banking', 'Quick FD'],
    minDeposit: 1000, prematureWithdrawal: 'Yes (0.5% penalty)', taxSaver: true,
    tenures: {
      '7d': { general: 3.75, senior: 4.25 }, '30d': { general: 6.00, senior: 6.50 },
      '90d': { general: 7.00, senior: 7.50 }, '180d': { general: 7.50, senior: 8.00 },
      '1y': { general: 8.00, senior: 8.50 }, '2y': { general: 7.75, senior: 8.25 },
      '3y': { general: 7.50, senior: 8.00 }, '5y': { general: 7.25, senior: 7.75 },
    },
  },
  {
    id: 'equitas', name: 'Equitas Small Finance Bank', short: 'Equitas SFB', type: 'sfb', logo: '🌟',
    features: ['DICGC ₹5L insured', 'Selfe FD', 'Auto-renewal', 'WhatsApp banking'],
    minDeposit: 5000, prematureWithdrawal: 'Yes', taxSaver: true,
    tenures: {
      '7d': { general: 3.50, senior: 4.00 }, '30d': { general: 5.50, senior: 6.00 },
      '90d': { general: 6.75, senior: 7.25 }, '180d': { general: 7.50, senior: 8.00 },
      '1y': { general: 8.25, senior: 8.75 }, '2y': { general: 8.00, senior: 8.50 },
      '3y': { general: 7.75, senior: 8.25 }, '5y': { general: 7.50, senior: 8.00 },
    },
  },
];

const TENURE_LABELS = {
  '7d': '7 Days', '14d': '14 Days', '30d': '30 Days', '45d': '45 Days',
  '90d': '3 Months', '180d': '6 Months',
  '1y': '1 Year', '2y': '2 Years', '3y': '3 Years', '5y': '5 Years',
};

const TENURE_YEARS = {
  '7d': 7/365, '14d': 14/365, '30d': 30/365, '45d': 45/365,
  '90d': 0.25, '180d': 0.5, '1y': 1, '2y': 2, '3y': 3, '5y': 5,
};

// ─── Get All Rates (flat) ────────────────────────────────────────
export function getAllFDRates() {
  const rates = [];
  for (const bank of BANKS) {
    for (const [tenure, rate] of Object.entries(bank.tenures)) {
      rates.push({
        bankId: bank.id, bankName: bank.name, bankShort: bank.short,
        type: bank.type, logo: bank.logo,
        tenure, tenureLabel: TENURE_LABELS[tenure] || tenure,
        rate: rate.general, seniorRate: rate.senior,
        minDeposit: bank.minDeposit, taxSaver: bank.taxSaver,
        features: bank.features,
      });
    }
  }
  return rates.sort((a, b) => b.rate - a.rate);
}

// ─── Get Best Rates for a Tenure ─────────────────────────────────
export function getBestFDRates(tenure = '1y', isSenior = false, limit = 15) {
  return BANKS
    .filter(b => b.tenures[tenure])
    .map(b => ({
      bankId: b.id, bankName: b.name, bankShort: b.short,
      type: b.type, logo: b.logo,
      tenure, tenureLabel: TENURE_LABELS[tenure],
      rate: b.tenures[tenure].general,
      seniorRate: b.tenures[tenure].senior,
      displayRate: isSenior ? b.tenures[tenure].senior : b.tenures[tenure].general,
      minDeposit: b.minDeposit, taxSaver: b.taxSaver,
      features: b.features,
    }))
    .sort((a, b) => b.displayRate - a.displayRate)
    .slice(0, limit);
}

// ─── Get Bank Detail ─────────────────────────────────────────────
export function getBankDetail(bankId) {
  const bank = BANKS.find(b => b.id === bankId);
  if (!bank) return null;
  return {
    ...bank,
    allRates: Object.entries(bank.tenures).map(([tenure, rate]) => ({
      tenure, tenureLabel: TENURE_LABELS[tenure],
      general: rate.general, senior: rate.senior,
      tenureYears: TENURE_YEARS[tenure],
    })),
  };
}

// ─── Calculate FD Maturity ───────────────────────────────────────
export function calculateFDMaturity(principal, rate, tenureYears, compound = 'quarterly') {
  const n = compound === 'monthly' ? 12 : compound === 'yearly' ? 1 : 4;
  const r = rate / 100;
  const maturity = principal * Math.pow(1 + r / n, n * tenureYears);
  const interest = maturity - principal;
  const yearlyInterest = interest / Math.max(tenureYears, 1);
  let tds = 0;
  if (yearlyInterest > 40000) tds = yearlyInterest > 80000 ? interest * 0.2 : interest * 0.1;
  return {
    principal, rate, tenureYears, maturityValue: Math.round(maturity),
    totalInterest: Math.round(interest), tds: Math.round(tds),
    netMaturity: Math.round(maturity - tds), effectiveRate: ((maturity / principal - 1) / tenureYears * 100).toFixed(2),
  };
}

// ─── Top FDs for Dashboard ───────────────────────────────────────
export async function getTopFDs() {
  return getBestFDRates('1y', false, 14);
}

export function formatFDRate(rate) { return `${rate.toFixed(2)}%`; }

export default { BANKS, getAllFDRates, getBestFDRates, getBankDetail, calculateFDMaturity, getTopFDs, formatFDRate };
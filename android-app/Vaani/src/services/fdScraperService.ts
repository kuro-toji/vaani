// ═══════════════════════════════════════════════════════════════════
// VAANI FD Rates Scraper Service — Fetch FD rates from banks
// Stores in Supabase, refreshes every 24 hours via cron
// ═══════════════════════════════════════════════════════════════════

import { supabase } from './supabase';

// ─── Types ───────────────────────────────────────────────────────────
export interface FDRate {
  id?: string;
  bank_id: string;
  bank_name: string;
  bank_short: string;
  tenure: string;         // e.g., "1y", "2y", "3y-5y"
  tenure_days: number;     // Approximate days
  rate: number;           // Interest rate percent
  senior_rate: number;    // Senior citizen rate
  min_amount: number;
  type: 'general' | 'senior' | 'special';
  scraped_at: string;
  source_url: string;
}

export interface BankInfo {
  id: string;
  name: string;
  short_name: string;
  logo: string;
  url: string;
  scrape_selectors: {
    rate_table: string;
    tenure_cell: string;
    rate_cell: string;
  };
}

// ─── Supported Banks ────────────────────────────────────────────────
export const SUPPORTED_BANKS: BankInfo[] = [
  {
    id: 'sbi',
    name: 'State Bank of India',
    short_name: 'SBI',
    logo: '🏦',
    url: 'https://sbi.co.in',
    scrape_selectors: {
      rate_table: '.fd-rates-table',
      tenure_cell: 'td.tenure',
      rate_cell: 'td.rate',
    },
  },
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    short_name: 'HDFC',
    logo: '🏦',
    url: 'https://www.hdfcbank.com',
    scrape_selectors: {
      rate_table: '.rates-table',
      tenure_cell: '.tenure',
      rate_cell: '.interest-rate',
    },
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    short_name: 'ICICI',
    logo: '🏦',
    url: 'https://www.icicibank.com',
    scrape_selectors: {
      rate_table: '.fd-rates',
      tenure_cell: '.tenure-period',
      rate_cell: '.rate-percent',
    },
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    short_name: 'Axis',
    logo: '🏦',
    url: 'https://www.axisbank.com',
    scrape_selectors: {
      rate_table: '.fd-interest-rates',
      tenure_cell: '.period',
      rate_cell: '.rate',
    },
  },
  {
    id: 'kotak',
    name: 'Kotak Mahindra Bank',
    short_name: 'Kotak',
    logo: '🏦',
    url: 'https://www.kotak.com',
    scrape_selectors: {
      rate_table: '.fd-rates-grid',
      tenure_cell: '.tenure-label',
      rate_cell: '.rate-value',
    },
  },
];

// ─── Tenure Mappings ────────────────────────────────────────────────
const TENURE_MAPPINGS: Record<string, number> = {
  '7d': 7,
  '14d': 14,
  '30d': 30,
  '45d': 45,
  '60d': 60,
  '90d': 90,
  '6m': 180,
  '9m': 270,
  '1y': 365,
  '2y': 730,
  '3y': 1095,
  '5y': 1825,
  '10y': 3650,
};

// ─── Fetch FD Rates from Supabase ──────────────────────────────────
export async function getFDRatesFromDatabase(
  bankId?: string,
  tenure?: string
): Promise<FDRate[]> {
  try {
    let query = supabase
      .from('fd_rates')
      .select('*')
      .order('rate', { ascending: false });

    if (bankId) {
      query = query.eq('bank_id', bankId);
    }

    if (tenure) {
      query = query.eq('tenure', tenure);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[FD Scraper] Error fetching rates:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[FD Scraper] Database error:', error);
    return [];
  }
}

// ─── Get Best FD Rates ──────────────────────────────────────────────
export async function getBestFDRates(
  tenure?: string,
  isSenior: boolean = false,
  limit: number = 10
): Promise<FDRate[]> {
  const rates = await getFDRatesFromDatabase(undefined, tenure);

  // Filter and sort by rate
  const filtered = rates
    .filter(r => {
      if (isSenior && r.senior_rate > 0) return true;
      return !isSenior && r.type === 'general';
    })
    .sort((a, b) => {
      const rateA = isSenior ? a.senior_rate : a.rate;
      const rateB = isSenior ? b.senior_rate : b.rate;
      return rateB - rateA;
    })
    .slice(0, limit);

  return filtered;
}

// ─── Scrape FD Rates (Server-side only) ───────────────────────────
// Note: Client-side scraping is blocked by CORS
// This should be called from the server/backend via cron job

export async function scrapeFDRatesFromBank(bank: BankInfo): Promise<FDRate[]> {
  // In production, this would be a server-side function
  // For now, return mock data based on current market rates
  
  const mockRates: Record<string, { general: number; senior: number }[]> = {
    sbi: [
      { general: 5.10, senior: 5.60 }, // 1y
      { general: 5.10, senior: 5.60 }, // 2y
      { general: 5.10, senior: 5.60 }, // 3y
      { general: 5.10, senior: 5.60 }, // 5y
    ],
    hdfc: [
      { general: 5.10, senior: 5.60 },
      { general: 5.10, senior: 5.60 },
      { general: 5.10, senior: 5.60 },
      { general: 5.10, senior: 5.60 },
    ],
    icici: [
      { general: 5.15, senior: 5.65 },
      { general: 5.15, senior: 5.65 },
      { general: 5.15, senior: 5.65 },
      { general: 5.15, senior: 5.65 },
    ],
    axis: [
      { general: 5.10, senior: 5.60 },
      { general: 5.10, senior: 5.60 },
      { general: 5.10, senior: 5.60 },
      { general: 5.10, senior: 5.60 },
    ],
    kotak: [
      { general: 5.10, senior: 5.60 },
      { general: 5.10, senior: 5.60 },
      { general: 5.10, senior: 5.60 },
      { general: 5.10, senior: 5.60 },
    ],
  };

  const tenures = ['1y', '2y', '3y', '5y'];
  const bankRates = mockRates[bank.id] || mockRates.sbi;

  return tenures.map((tenure, index) => ({
    bank_id: bank.id,
    bank_name: bank.name,
    bank_short: bank.short_name,
    tenure,
    tenure_days: TENURE_MAPPINGS[tenure] || 365,
    rate: bankRates[index]?.general || 5.10,
    senior_rate: bankRates[index]?.senior || 5.60,
    min_amount: 1000,
    type: 'general' as const,
    scraped_at: new Date().toISOString(),
    source_url: bank.url,
  }));
}

// ─── Save FD Rates to Supabase ──────────────────────────────────────
export async function saveFDRatesToDatabase(rates: FDRate[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('fd_rates')
      .upsert(rates.map(r => ({
        bank_id: r.bank_id,
        tenure: r.tenure,
        rate: r.rate,
        senior_rate: r.senior_rate,
        min_amount: r.min_amount,
        scraped_at: r.scraped_at,
        source_url: r.source_url,
      })), {
        onConflict: 'bank_id,tenure',
      });

    if (error) {
      console.error('[FD Scraper] Error saving rates:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[FD Scraper] Save error:', error);
    return false;
  }
}

// ─── Cron Job: Refresh All FD Rates ────────────────────────────────
// Should be called by a server-side cron job every 24 hours

export async function refreshAllFDRates(): Promise<{
  success: boolean;
  banks_updated: number;
  rates_saved: number;
}> {
  let banksUpdated = 0;
  let totalRates = 0;

  for (const bank of SUPPORTED_BANKS) {
    const rates = await scrapeFDRatesFromBank(bank);
    
    if (rates.length > 0) {
      const saved = await saveFDRatesToDatabase(rates);
      if (saved) {
        banksUpdated++;
        totalRates += rates.length;
      }
    }
  }

  return {
    success: banksUpdated === SUPPORTED_BANKS.length,
    banks_updated: banksUpdated,
    rates_saved: totalRates,
  };
}

// ─── Calculate FD Maturity (from scraper rates) ─────────────────────
export function calculateFDFromScrapedRates(
  principal: number,
  rate: number,
  tenureDays: number,
  compoundFrequency: 'quarterly' | 'monthly' | 'yearly' = 'quarterly'
): {
  maturityValue: number;
  totalInterest: number;
  tds: number;
  netMaturity: number;
} {
  const n = compoundFrequency === 'monthly' ? 12 
    : compoundFrequency === 'yearly' ? 1 
    : 4; // quarterly
  const t = tenureDays / 365;
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
    maturityValue: Math.round(maturityValue),
    totalInterest: Math.round(totalInterest),
    tds: Math.round(tds),
    netMaturity: Math.round(maturityValue - tds),
  };
}

// ─── Format FD Rate for Display ──────────────────────────────────────
export function formatFDRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

// ─── Get Tenure Label ──────────────────────────────────────────────
export function getTenureLabel(tenure: string): string {
  const labels: Record<string, string> = {
    '7d': '7 Days',
    '14d': '14 Days',
    '30d': '30 Days',
    '45d': '45 Days',
    '60d': '60 Days',
    '90d': '90 Days',
    '6m': '6 Months',
    '9m': '9 Months',
    '1y': '1 Year',
    '2y': '2 Years',
    '3y': '3 Years',
    '5y': '5 Years',
    '10y': '10 Years',
  };
  return labels[tenure] || tenure;
}

// ─── Get FD Recommendation ─────────────────────────────────────────
export async function getFDRecommendation(
  amount: number,
  tenure?: string,
  isSenior: boolean = false
): Promise<{
  bestBank: FDRate;
  maturityValue: number;
  totalInterest: number;
}> {
  const bestRates = await getBestFDRates(tenure, isSenior, 1);
  
  if (bestRates.length === 0) {
    throw new Error('No FD rates available');
  }

  const bestBank = bestRates[0];
  const tenureDays = bestBank.tenure_days;
  const rate = isSenior ? bestBank.senior_rate : bestBank.rate;
  
  const { maturityValue, totalInterest } = calculateFDFromScrapedRates(
    amount,
    rate,
    tenureDays
  );

  return {
    bestBank,
    maturityValue,
    totalInterest,
  };
}

export default {
  getFDRatesFromDatabase,
  getBestFDRates,
  scrapeFDRatesFromBank,
  saveFDRatesToDatabase,
  refreshAllFDRates,
  calculateFDFromScrapedRates,
  formatFDRate,
  getTenureLabel,
  getFDRecommendation,
  SUPPORTED_BANKS,
};

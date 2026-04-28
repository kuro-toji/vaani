// ═══════════════════════════════════════════════════════════════════
// VAANI AMFI Mutual Fund Service — Fetch NAV from official AMFI India API
// API: https://api.mfapi.in/mf — Free, no API key, 10,000+ funds
// ═══════════════════════════════════════════════════════════════════

import { SIPInvestment } from '../types';
import { calculateXIRR, formatCurrency } from './financeService';

const AMFI_API_BASE = 'https://api.mfapi.in/mf';

// ─── Types ───────────────────────────────────────────────────────────
export interface MFFund {
  schemeCode: number;
  schemeName: string;
}

export interface MFFundDetail {
  fundHouse: string;
  schemeType: string;
  schemeCategory: string;
  schemeCode: number;
  schemeName: string;
  nav: string;
  date: string;
}

export interface MFNavEntry {
  schemeCd: number;
  schemeName: string;
  nav: string;
  repDt: string;
}

export interface MFNavData {
  status: string;
  data: MFNavEntry[];
}

export interface SIPHolding {
  id: string;
  fundName: string;
  fundCode: number;
  nav: number;
  units: number;
  investedAmount: number;
  currentValue: number;
  xirr: number;
}

// ─── Fetch All Funds (for search/autocomplete) ─────────────────────
export async function fetchAllFunds(): Promise<MFFund[]> {
  try {
    const response = await fetch(`${AMFI_API_BASE}`);
    if (!response.ok) throw new Error('Failed to fetch funds');
    const data: MFFund[] = await response.json();
    return data.sort((a, b) => a.schemeName.localeCompare(b.schemeName));
  } catch (error) {
    console.error('[AMFI] Error fetching funds:', error);
    return [];
  }
}

// ─── Fetch NAV by Scheme Code ───────────────────────────────────────
export async function fetchNavByCode(schemeCode: number): Promise<MFNavData | null> {
  try {
    const response = await fetch(`${AMFI_API_BASE}/${schemeCode}`);
    if (!response.ok) throw new Error('Failed to fetch NAV');
    const data: MFNavData = await response.json();
    return data;
  } catch (error) {
    console.error('[AMFI] Error fetching NAV:', error);
    return null;
  }
}

// ─── Search Funds by Name ───────────────────────────────────────────
export async function searchFunds(query: string): Promise<MFFund[]> {
  if (!query || query.length < 2) return [];
  
  const funds = await fetchAllFunds();
  const lowerQuery = query.toLowerCase();
  
  return funds.filter(fund => 
    fund.schemeName.toLowerCase().includes(lowerQuery) ||
    fund.schemeCode.toString().includes(lowerQuery)
  ).slice(0, 20); // Limit to 20 results
}

// ─── Calculate SIP Current Value ───────────────────────────────────
export async function calculateSIPValue(
  fundCode: number,
  monthlyAmount: number,
  startDate: Date
): Promise<{ nav: number; units: number; currentValue: number; invested: number } | null> {
  const navData = await fetchNavByCode(fundCode);
  if (!navData || !navData.data || navData.data.length === 0) return null;

  const currentNav = parseFloat(navData.data[0].nav);
  const startNav = await getNavAtDate(fundCode, startDate);
  
  if (!startNav) return null;

  // Calculate months between start date and now
  const months = monthsBetween(startDate, new Date());
  const invested = monthlyAmount * months;
  const unitsPerMonth = monthlyAmount / startNav;
  
  // XIRR calculation requires cash flows
  const cashflows = generateSIPCashflows(monthlyAmount, startDate, new Date());
  cashflows.push({ amount: unitsPerMonth * currentNav, date: new Date() }); // Final value
  
  const xirr = calculateXIRR(cashflows);
  const totalUnits = unitsPerMonth * months;
  const currentValue = totalUnits * currentNav;

  return {
    nav: currentNav,
    units: totalUnits,
    currentValue: Math.round(currentValue),
    invested: Math.round(invested),
  };
}

// ─── Get NAV at Specific Date (for historical calculations) ─────────
async function getNavAtDate(fundCode: number, targetDate: Date): Promise<number | null> {
  const navData = await fetchNavByCode(fundCode);
  if (!navData || !navData.data) return null;

  const targetStr = formatDateForAMFI(targetDate);
  
  // Find exact date or closest previous date
  const sortedData = navData.data.sort((a, b) => 
    new Date(b.repDt).getTime() - new Date(a.repDt).getTime()
  );

  for (const entry of sortedData) {
    if (entry.nav && parseFloat(entry.nav) > 0) {
      if (new Date(entry.repDt) <= targetDate) {
        return parseFloat(entry.nav);
      }
    }
  }
  
  return null;
}

// ─── Generate SIP Cashflows for XIRR ────────────────────────────────
function generateSIPCashflows(
  monthlyAmount: number,
  startDate: Date,
  endDate: Date
): { amount: number; date: Date }[] {
  const cashflows: { amount: number; date: Date }[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    cashflows.push({ amount: -monthlyAmount, date: new Date(current) });
    current.setMonth(current.getMonth() + 1);
  }
  
  return cashflows;
}

// ─── Helper: Months Between Two Dates ───────────────────────────────
function monthsBetween(start: Date, end: Date): number {
  return (end.getFullYear() - start.getFullYear()) * 12 + 
         (end.getMonth() - start.getMonth());
}

// ─── Helper: Format Date for AMFI API ──────────────────────────────
function formatDateForAMFI(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// ─── Get Historical NAV Data ────────────────────────────────────────
export async function getHistoricalNAV(
  fundCode: number,
  startDate: Date,
  endDate: Date = new Date()
): Promise<{ date: string; nav: number }[]> {
  const navData = await fetchNavByCode(fundCode);
  if (!navData || !navData.data) return [];

  return navData.data
    .filter(entry => {
      const entryDate = new Date(entry.repDt);
      return entryDate >= startDate && entryDate <= endDate && entry.nav;
    })
    .map(entry => ({
      date: entry.repDt,
      nav: parseFloat(entry.nav),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ─── Calculate XIRR for SIP Investment ─────────────────────────────
export function calculateSIPXIRR(
  purchases: { date: Date; amount: number }[],
  currentValue: number,
  currentDate: Date = new Date()
): number {
  const cashflows: { amount: number; date: Date }[] = [
    ...purchases.map(p => ({ amount: -p.amount, date: p.date })),
    { amount: currentValue, date: currentDate },
  ];
  
  return calculateXIRR(cashflows);
}

// ─── Get Best Performing Funds (Category Based) ──────────────────────
export async function getTopFundsByCategory(
  category: string,
  limit: number = 5
): Promise<{ schemeCode: number; schemeName: string; nav: string }[]> {
  const funds = await fetchAllFunds();
  const filtered = funds.filter(f => 
    f.schemeName.toLowerCase().includes(category.toLowerCase())
  );
  
  const results: { schemeCode: number; schemeName: string; nav: string }[] = [];
  
  for (const fund of filtered.slice(0, limit * 2)) {
    const navData = await fetchNavByCode(fund.schemeCode);
    if (navData && navData.data && navData.data[0]?.nav) {
      results.push({
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        nav: navData.data[0].nav,
      });
      if (results.length >= limit) break;
    }
  }
  
  return results;
}

// ─── Format Fund Name for Display ──────────────────────────────────
export function formatFundName(name: string): string {
  // Remove common prefixes like "Axis Blue Chip Fund - Direct Plan - Growth"
  const parts = name.split(' - ');
  if (parts.length >= 2) {
    return parts.slice(0, 2).join(' - ');
  }
  return name;
}

export default {
  fetchAllFunds,
  fetchNavByCode,
  searchFunds,
  calculateSIPValue,
  getHistoricalNAV,
  calculateSIPXIRR,
  getTopFundsByCategory,
  formatFundName,
};

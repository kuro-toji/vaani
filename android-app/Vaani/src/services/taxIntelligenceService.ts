// ═══════════════════════════════════════════════════════════════════
// VAANI Tax Intelligence Service
// Tax harvesting, advance tax, TDS detection, 80C tracking
// ═══════════════════════════════════════════════════════════════════

import * as DB from '../database';
import type { TaxHarvestingOpportunity, AdvanceTaxDeadline, Section80CTracker } from '../types';

const TAX = {
  STCG_RATE: 0.20, LTCG_RATE: 0.125, LTCG_EXEMPTION: 125000,
  SECTION_80C_LIMIT: 150000, NPS_80CCD_LIMIT: 50000,
  EQUITY_LTCG_DAYS: 365, TDS_SINGLE: 30000, TDS_ANNUAL: 100000,
  DEADLINES: [
    { quarter: 1 as const, date: '06-15', pct: 15 },
    { quarter: 2 as const, date: '09-15', pct: 45 },
    { quarter: 3 as const, date: '12-15', pct: 75 },
    { quarter: 4 as const, date: '03-15', pct: 100 },
  ],
};

const SLABS = [
  { min: 0, max: 400000, rate: 0 }, { min: 400000, max: 800000, rate: 0.05 },
  { min: 800000, max: 1200000, rate: 0.10 }, { min: 1200000, max: 1600000, rate: 0.15 },
  { min: 1600000, max: 2000000, rate: 0.20 }, { min: 2000000, max: 2400000, rate: 0.25 },
  { min: 2400000, max: Infinity, rate: 0.30 },
];

function getCurrentFY(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export function calculateIncomeTax(income: number): { tax: number; effectiveRate: number } {
  let tax = 0;
  for (const s of SLABS) {
    if (income <= s.min) break;
    tax += (Math.min(income, s.max) - s.min) * s.rate;
  }
  tax *= 1.04; // 4% cess
  return { tax: Math.round(tax), effectiveRate: income > 0 ? Math.round((tax / income) * 10000) / 100 : 0 };
}

export async function analyzeTaxHarvesting(userId: string): Promise<TaxHarvestingOpportunity[]> {
  const holdings = await DB.getInvestmentHoldings(userId);
  const opps: TaxHarvestingOpportunity[] = [];
  const today = new Date();

  for (const h of holdings) {
    const days = Math.floor((today.getTime() - new Date(h.buy_date).getTime()) / 86400000);
    const gain = (h.current_price - h.buy_price) * (h.quantity || 1);
    if (gain <= 0) continue;

    const isLTCG = days >= TAX.EQUITY_LTCG_DAYS;
    const daysToLTCG = isLTCG ? 0 : TAX.EQUITY_LTCG_DAYS - days;
    const taxNow = isLTCG ? Math.max(0, gain - TAX.LTCG_EXEMPTION) * TAX.LTCG_RATE : gain * TAX.STCG_RATE;
    const taxIfWait = Math.max(0, gain - TAX.LTCG_EXEMPTION) * TAX.LTCG_RATE;
    const savings = taxNow - taxIfWait;

    if (savings > 100 && !isLTCG) {
      opps.push({
        holding_id: h.id, asset_name: h.asset_name,
        gain_type: 'STCG', gain_amount: Math.round(gain),
        tax_at_current: Math.round(taxNow), tax_if_wait: Math.round(taxIfWait),
        savings: Math.round(savings), days_to_ltcg: daysToLTCG,
        recommendation: daysToLTCG <= 7
          ? `${daysToLTCG} din ruko — LTCG ho jayega, ₹${Math.round(savings).toLocaleString('en-IN')} bachenge`
          : `${daysToLTCG} din aur hold karo, ₹${Math.round(savings).toLocaleString('en-IN')} tax bachega`,
      });
    }
  }

  // Tax loss harvesting
  for (const h of holdings) {
    const gain = (h.current_price - h.buy_price) * (h.quantity || 1);
    if (gain >= 0) continue;
    const totalGains = opps.reduce((s, o) => s + o.gain_amount, 0);
    if (totalGains > 0) {
      opps.push({
        holding_id: h.id, asset_name: h.asset_name, gain_type: 'STCG',
        gain_amount: Math.round(gain), tax_at_current: 0, tax_if_wait: 0,
        savings: Math.round(Math.abs(gain) * TAX.STCG_RATE), days_to_ltcg: 0,
        recommendation: `Yeh loss wala fund becho — gain ke against set-off ho jayega, ₹${Math.round(Math.abs(gain) * TAX.STCG_RATE).toLocaleString('en-IN')} tax bachega`,
      });
    }
  }
  return opps.sort((a, b) => b.savings - a.savings);
}

export async function calculateAdvanceTax(userId: string, income: number): Promise<AdvanceTaxDeadline[]> {
  const fy = getCurrentFY();
  const payments = await DB.getAdvanceTaxPayments(userId, fy);
  const { tax: totalTax } = calculateIncomeTax(income);

  return TAX.DEADLINES.map(d => {
    const yr = d.quarter <= 3 ? parseInt(fy.split('-')[0]) : parseInt(fy.split('-')[1]);
    const dDate = `${yr}-${d.date}`;
    const paid = payments.filter((p: any) => p.quarter <= d.quarter).reduce((s: number, p: any) => s + p.amount, 0);
    const due = Math.round(totalTax * d.pct / 100);
    return {
      quarter: d.quarter, deadline_date: dDate, cumulative_percent: d.pct,
      estimated_income: income, tax_due: due, already_paid: paid,
      balance_due: Math.max(0, due - paid),
      days_remaining: Math.max(0, Math.ceil((new Date(dDate).getTime() - Date.now()) / 86400000)),
    };
  });
}

export function checkTDSApplicability(amount: number, totalFromPayer: number) {
  if (amount >= TAX.TDS_SINGLE) {
    const tds = Math.round(amount * 0.10);
    return { applicable: true, estimatedTDS: tds, voiceAlert: `Is payment pe TDS kata hoga — lagbhag ₹${tds.toLocaleString('en-IN')}. Form 26AS mein check karo.` };
  }
  if (totalFromPayer >= TAX.TDS_ANNUAL) {
    return { applicable: true, estimatedTDS: Math.round(amount * 0.10), voiceAlert: `Is client se ₹1 lakh se zyada aa gaya. PAN de do unko — TDS katna chahiye.` };
  }
  return { applicable: false, estimatedTDS: 0, voiceAlert: '' };
}

export async function get80CStatus(userId: string): Promise<Section80CTracker> {
  const fy = getCurrentFY();
  const entries = await DB.getTax80CEntries(userId, fy);
  const bk: Record<string, number> = { epf: 0, ppf: 0, elss: 0, life_insurance: 0, nsc: 0, tuition_fees: 0, home_loan_principal: 0, other: 0 };
  for (const e of entries) { bk[e.category] = (bk[e.category] || 0) + e.amount; }
  const used = Object.values(bk).reduce((s, v) => s + v, 0);
  const rem = Math.max(0, TAX.SECTION_80C_LIMIT - used);
  const sugg: string[] = [];
  if (rem > 0) {
    if (!bk.elss) sugg.push(`ELSS mein ₹${Math.min(rem, 50000).toLocaleString('en-IN')} lagao — tax bhi bachega, return bhi milega`);
    if (!bk.ppf) sugg.push(`PPF mein daal do — guaranteed 7.1% return`);
    sugg.push(`NPS mein ₹50,000 extra daal do — 80CCD(1B) deduction milega`);
  }
  return { user_id: userId, total_limit: TAX.SECTION_80C_LIMIT, utilized: Math.min(used, TAX.SECTION_80C_LIMIT), remaining: rem, breakdown: bk as any, suggestions: sugg };
}

export function generateAdvanceTaxAlert(d: AdvanceTaxDeadline): string {
  if (d.days_remaining <= 0 || d.balance_due <= 0) return '';
  return `Advance tax ki deadline ${d.days_remaining} din mein hai. ₹${d.balance_due.toLocaleString('en-IN')} bharrna hoga. Chalein?`;
}

export default { calculateIncomeTax, analyzeTaxHarvesting, calculateAdvanceTax, checkTDSApplicability, get80CStatus, generateAdvanceTaxAlert, TAX };

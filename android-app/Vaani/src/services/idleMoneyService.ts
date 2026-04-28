// ═══════════════════════════════════════════════════════════════════
// VAANI Idle Money Detection Service
// Detects idle balance, suggests liquid funds / T-bills
// Voice: "₹12,000 idle hai, liquid fund mein lagaein?"
// ═══════════════════════════════════════════════════════════════════

import * as DB from '../database';
import { fetchAllFunds } from './amfiService';
import type { IdleMoneyDetection, BankAccount } from '../types';

// ─── Constants ───────────────────────────────────────────────────
const IDLE_THRESHOLD = 5000; // Minimum idle amount to trigger alert
const EMERGENCY_MONTHS = 3;  // Keep 3 months expenses as emergency
const LIQUID_FUND_RETURN = 6.5; // Average liquid fund return %
const SAVINGS_ACCOUNT_RETURN = 3.0; // Average savings rate %

// ─── Top Liquid Funds (curated for instant suggestions) ─────────
const TOP_LIQUID_FUNDS = [
  { name: 'HDFC Liquid Fund - Direct', code: '118989', avgReturn: 6.8 },
  { name: 'ICICI Prudential Liquid Fund - Direct', code: '120716', avgReturn: 6.7 },
  { name: 'SBI Liquid Fund - Direct', code: '119598', avgReturn: 6.6 },
  { name: 'Axis Liquid Fund - Direct', code: '120503', avgReturn: 6.5 },
  { name: 'Kotak Liquid Fund - Direct', code: '118834', avgReturn: 6.4 },
];

// ─── Detect Idle Money ──────────────────────────────────────────
export async function detectIdleMoney(userId: string): Promise<IdleMoneyDetection | null> {
  try {
    // Get all bank accounts
    const accounts = await DB.getBankAccounts(userId);
    if (accounts.length === 0) return null;

    const totalBalance = accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);

    // Get upcoming EMIs
    const loans = await DB.getLoans(userId);
    const upcomingEmis = loans.reduce((sum: number, loan: any) => sum + (loan.emi_amount || 0), 0);

    // Get monthly budget (average of last 3 months expenses)
    const now = new Date();
    let totalExpenses = 0;
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const expenses = await DB.getMonthlySpendByCategory(userId, month);
      totalExpenses += expenses.reduce((sum: number, e: any) => sum + (e.total || 0), 0);
    }
    const monthlyBudget = totalExpenses / 3;

    // Emergency buffer = 3 months of expenses
    const emergencyBuffer = monthlyBudget * EMERGENCY_MONTHS;

    // Idle amount = total balance - upcoming EMIs - monthly budget - emergency buffer
    const idleAmount = totalBalance - upcomingEmis - monthlyBudget - emergencyBuffer;

    if (idleAmount < IDLE_THRESHOLD) return null;

    // Check if we already detected this today
    const existing = await DB.getIdleMoneyDetections(userId);
    const today = new Date().toISOString().split('T')[0];
    const alreadyDetected = existing.find((d: any) => d.detection_date === today);
    if (alreadyDetected) return alreadyDetected as unknown as IdleMoneyDetection;

    // Find best liquid fund suggestion
    const suggestedFund = TOP_LIQUID_FUNDS[0].name;

    // Save detection
    const id = await DB.addIdleMoneyDetection({
      user_id: userId,
      detected_amount: Math.round(idleAmount),
      total_balance: totalBalance,
      upcoming_emis: upcomingEmis,
      monthly_budget: Math.round(monthlyBudget),
      emergency_buffer: Math.round(emergencyBuffer),
      suggested_product: suggestedFund,
    });

    return {
      id,
      user_id: userId,
      detected_amount: Math.round(idleAmount),
      total_balance: totalBalance,
      upcoming_emis: upcomingEmis,
      monthly_budget: Math.round(monthlyBudget),
      emergency_buffer: Math.round(emergencyBuffer),
      detection_date: today,
      action_taken: 'pending',
      reminder_count: 0,
      suggested_product: suggestedFund,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[IdleMoney] Detection error:', error);
    return null;
  }
}

// ─── Calculate Extra Earnings from Idle Money ────────────────────
export function calculateExtraEarnings(idleAmount: number, months: number = 12): {
  liquidFundEarnings: number;
  savingsEarnings: number;
  extraEarnings: number;
  monthlyExtra: number;
} {
  const liquidFundEarnings = idleAmount * (LIQUID_FUND_RETURN / 100) * (months / 12);
  const savingsEarnings = idleAmount * (SAVINGS_ACCOUNT_RETURN / 100) * (months / 12);
  const extraEarnings = liquidFundEarnings - savingsEarnings;

  return {
    liquidFundEarnings: Math.round(liquidFundEarnings),
    savingsEarnings: Math.round(savingsEarnings),
    extraEarnings: Math.round(extraEarnings),
    monthlyExtra: Math.round(extraEarnings / months),
  };
}

// ─── Get Liquid Fund Suggestions ─────────────────────────────────
export async function getLiquidFundSuggestions(limit: number = 3): Promise<typeof TOP_LIQUID_FUNDS> {
  try {
    // Try live data from AMFI
    const allFunds = await fetchAllFunds();
    const liquidFunds = allFunds
      .filter((f: any) => f.schemeName.toLowerCase().includes('liquid') && f.schemeName.toLowerCase().includes('direct'))
      .slice(0, limit);

    if (liquidFunds.length > 0) {
      return liquidFunds.map((f: any) => ({
        name: f.schemeName,
        code: f.schemeCode.toString(),
        avgReturn: 6.5, // Approximate
      }));
    }
  } catch (e) {
    // Fall back to curated list
  }

  return TOP_LIQUID_FUNDS.slice(0, limit);
}

// ─── Mark Idle Money Action ──────────────────────────────────────
export async function markIdleMoneyAction(detectionId: string, action: 'invested' | 'ignored' | 'reminded'): Promise<void> {
  await DB.updateIdleMoneyAction(detectionId, action);
}

// ─── Generate Voice Alert ────────────────────────────────────────
export function generateIdleMoneyVoiceAlert(detection: IdleMoneyDetection, language: string = 'hi'): string {
  const amount = detection.detected_amount;
  const earnings = calculateExtraEarnings(amount);

  if (language === 'en') {
    return `You have ₹${amount.toLocaleString('en-IN')} sitting idle in your account. If you put it in a liquid fund, you can earn ₹${earnings.monthlyExtra.toLocaleString('en-IN')} extra per month. Want to invest?`;
  }

  // Hindi default
  return `आपके खाते में ₹${amount.toLocaleString('en-IN')} बैठे-बैठे कुछ नहीं कर रहे। इसे liquid fund में लगाएं तो महीने में ₹${earnings.monthlyExtra.toLocaleString('en-IN')} extra मिलेंगे। लगाना है?`;
}

// ─── Add/Update Bank Account Balance ─────────────────────────────
export async function updateAccountBalance(userId: string, bankName: string, balance: number): Promise<string> {
  const accounts = await DB.getBankAccounts(userId);
  const existing = accounts.find((a: any) => a.bank_name.toLowerCase() === bankName.toLowerCase());

  if (existing) {
    await DB.updateBankBalance(existing.id, balance);
    return existing.id;
  }

  return await DB.addBankAccount({
    user_id: userId,
    bank_name: bankName,
    balance,
    is_primary: accounts.length === 0,
  });
}

// ─── Get All Account Balances ────────────────────────────────────
export async function getAllBalances(userId: string): Promise<{ accounts: BankAccount[]; total: number }> {
  const accounts = await DB.getBankAccounts(userId);
  const total = accounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
  return { accounts: accounts as unknown as BankAccount[], total };
}

export default {
  detectIdleMoney,
  calculateExtraEarnings,
  getLiquidFundSuggestions,
  markIdleMoneyAction,
  generateIdleMoneyVoiceAlert,
  updateAccountBalance,
  getAllBalances,
  IDLE_THRESHOLD,
};

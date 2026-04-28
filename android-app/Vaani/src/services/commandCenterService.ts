// ═══════════════════════════════════════════════════════════════════
// VAANI Financial Command Center Service
// Net worth, debt tracker, FIRE calculator, spending analytics
// Voice: "Meri total daulat kitni hai?"
// ═══════════════════════════════════════════════════════════════════

import * as DB from '../database';
import type { ExtendedNetWorth, DebtSummary, FIRETracker, Loan } from '../types';

// ─── Live Net Worth ──────────────────────────────────────────────
export async function getExtendedNetWorth(userId: string): Promise<ExtendedNetWorth> {
  const nw = await DB.getNetWorthData(userId);
  const loans = await DB.getLoans(userId);

  const liabilities: Record<string, number> = { home_loan: 0, car_loan: 0, personal_loan: 0, credit_card: 0, other: 0 };
  let totalEmi = 0;
  for (const l of loans) {
    const key = l.loan_type === 'home' ? 'home_loan' : l.loan_type === 'car' ? 'car_loan'
      : l.loan_type === 'personal' ? 'personal_loan' : l.loan_type === 'credit_card' ? 'credit_card' : 'other';
    liabilities[key] += l.outstanding || 0;
    totalEmi += l.emi_amount || 0;
  }

  // Get monthly income/expense from current month
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const expenses = await DB.getMonthlySpendByCategory(userId, month);
  const totalExpense = expenses.reduce((s: number, e: any) => s + (e.total || 0), 0);

  // Get income from freelancer + regular
  const freelancerIncome = await DB.getFreelancerIncome(userId);
  const monthIncome = freelancerIncome
    .filter((i: any) => i.payment_date?.startsWith(month))
    .reduce((s: number, i: any) => s + i.amount, 0);

  return {
    total_assets: nw.total_assets,
    total_liabilities: nw.total_liabilities,
    net_worth: nw.net_worth,
    breakdown: nw.breakdown,
    liabilities_breakdown: liabilities as any,
    monthly_income: monthIncome,
    monthly_expense: totalExpense,
    monthly_emi: totalEmi,
    monthly_savings: monthIncome - totalExpense - totalEmi,
  };
}

// ─── Full Debt Picture ───────────────────────────────────────────
export async function getDebtSummary(userId: string, monthlyIncome?: number): Promise<DebtSummary> {
  const loans = await DB.getLoans(userId);
  const totalOutstanding = loans.reduce((s: number, l: any) => s + (l.outstanding || 0), 0);
  const totalEmi = loans.reduce((s: number, l: any) => s + (l.emi_amount || 0), 0);
  const totalInterest = loans.reduce((s: number, l: any) => s + (l.total_interest_remaining || 0), 0);
  const income = monthlyIncome || 50000; // default
  const dtiRatio = income > 0 ? Math.round((totalEmi / income) * 100) : 0;

  // Prepayment suggestion: highest interest rate first (debt avalanche)
  const sorted = [...loans].sort((a: any, b: any) => (b.interest_rate || 0) - (a.interest_rate || 0));
  let prepaymentSuggestion;
  if (sorted.length > 0) {
    const top = sorted[0];
    const interestSaved = Math.round((top.outstanding || 0) * (top.interest_rate || 0) / 100 * 0.5);
    prepaymentSuggestion = {
      loan_id: top.id,
      loan_type: top.loan_type,
      reason: `Sabse zyada ${top.interest_rate}% interest rate hai — pehle yeh chukao`,
      interest_saved: interestSaved,
    };
  }

  return {
    total_outstanding: totalOutstanding,
    total_monthly_emi: totalEmi,
    total_interest_remaining: totalInterest,
    debt_to_income_ratio: dtiRatio,
    loans: loans as Loan[],
    prepayment_suggestion: prepaymentSuggestion,
  };
}

// ─── FIRE Calculator ─────────────────────────────────────────────
export async function calculateFIRE(userId: string): Promise<FIRETracker | null> {
  const fireSettings = await DB.getFIRESettings(userId);
  if (!fireSettings) return null;

  const nw = await DB.getNetWorthData(userId);
  const currentNW = nw.net_worth;
  const target = fireSettings.target_amount;
  const yearsRemaining = fireSettings.target_age - fireSettings.current_age;

  if (yearsRemaining <= 0) return null;

  // Monthly savings needed (assuming 12% annual return)
  const monthlyRate = 0.12 / 12;
  const months = yearsRemaining * 12;
  const remaining = target - currentNW;
  const fvFactor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
  const monthlySavingsNeeded = remaining > 0 ? Math.round(remaining / fvFactor) : 0;

  const progress = target > 0 ? Math.round((currentNW / target) * 100) : 0;

  // Extra ₹1000 spend impact: how many months retirement delayed
  const extraSpend = 1000;
  const monthsDelayed = monthlySavingsNeeded > 0
    ? Math.round((extraSpend / monthlySavingsNeeded) * 12 * 10) / 10
    : 0;

  return {
    user_id: userId,
    target_amount: target,
    target_age: fireSettings.target_age,
    current_age: fireSettings.current_age,
    current_net_worth: currentNW,
    monthly_savings_needed: monthlySavingsNeeded,
    years_remaining: yearsRemaining,
    progress_percent: progress,
    monthly_spending_impact: monthsDelayed,
  };
}

// ─── Add Loan by Voice ───────────────────────────────────────────
export async function addLoanByVoice(userId: string, loanType: string, lenderName: string, emiAmount: number, remainingMonths: number, interestRate?: number, outstanding?: number): Promise<string> {
  const rate = interestRate || (loanType === 'home' ? 8.5 : loanType === 'car' ? 9 : loanType === 'personal' ? 14 : 12);
  const outstandingAmt = outstanding || emiAmount * remainingMonths * 0.85; // approx

  return await DB.addLoan({
    user_id: userId, loan_type: loanType, lender_name: lenderName,
    principal: outstandingAmt, outstanding: outstandingAmt,
    interest_rate: rate, emi_amount: emiAmount,
    remaining_tenure_months: remainingMonths,
  });
}

// ─── Voice Summaries ─────────────────────────────────────────────
export function generateNetWorthVoice(nw: ExtendedNetWorth, lang: string = 'hi'): string {
  if (lang === 'en') {
    return `Your total net worth is ₹${nw.net_worth.toLocaleString('en-IN')}. Assets ₹${nw.total_assets.toLocaleString('en-IN')}, liabilities ₹${nw.total_liabilities.toLocaleString('en-IN')}. Monthly EMI burden ₹${nw.monthly_emi.toLocaleString('en-IN')}.`;
  }
  return `Aapki kul daulat ₹${nw.net_worth.toLocaleString('en-IN')} hai. Sampatti ₹${nw.total_assets.toLocaleString('en-IN')}, karza ₹${nw.total_liabilities.toLocaleString('en-IN')}. Mahine ka EMI ₹${nw.monthly_emi.toLocaleString('en-IN')} hai.`;
}

export function generateDebtVoice(debt: DebtSummary, lang: string = 'hi'): string {
  const dtiWarning = debt.debt_to_income_ratio > 40
    ? ` Yeh risky hai — income ka ${debt.debt_to_income_ratio}% EMI mein ja raha hai.` : '';
  if (lang === 'en') {
    return `Total debt ₹${debt.total_outstanding.toLocaleString('en-IN')}, monthly EMI ₹${debt.total_monthly_emi.toLocaleString('en-IN')}.${debt.prepayment_suggestion ? ` Tip: ${debt.prepayment_suggestion.reason}` : ''}`;
  }
  return `Kul karza ₹${debt.total_outstanding.toLocaleString('en-IN')}, mahine ka EMI ₹${debt.total_monthly_emi.toLocaleString('en-IN')}.${dtiWarning}${debt.prepayment_suggestion ? ` Sujhaav: ${debt.prepayment_suggestion.reason}` : ''}`;
}

export function generateFIREVoice(fire: FIRETracker): string {
  return `Aap ${fire.progress_percent}% pahunch gaye ho apne ₹${(fire.target_amount / 10000000).toFixed(1)} crore ke goal tak. Mahine mein ₹${fire.monthly_savings_needed.toLocaleString('en-IN')} bachaana hoga. ${fire.years_remaining} saal baaki hain.`;
}

export default { getExtendedNetWorth, getDebtSummary, calculateFIRE, addLoanByVoice, generateNetWorthVoice, generateDebtVoice, generateFIREVoice };

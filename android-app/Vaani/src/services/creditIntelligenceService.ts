// ═══════════════════════════════════════════════════════════════════
// VAANI Credit Intelligence Service
// Portfolio-backed credit, borrowing capacity, rate comparison
// Voice: "Credit card se sasta loan mil sakta hai"
// ═══════════════════════════════════════════════════════════════════

import * as DB from '../database';
import type { CreditOption, BorrowingCapacity, CreditComparison } from '../types';

// ─── Credit Product Rates ────────────────────────────────────────
const CREDIT_PRODUCTS: CreditOption[] = [
  {
    type: 'lamf', name: 'Loan Against Mutual Funds',
    interest_rate: 10.5, max_available: 0, collateral_required: 'Mutual Fund Units',
    processing_time: '2-3 din', explanation: 'Apne mutual fund units pledge karke loan lo — bechna nahi padega, aur rate bhi kam hai',
  },
  {
    type: 'fd_overdraft', name: 'FD Overdraft',
    interest_rate: 8.0, max_available: 0, collateral_required: 'Fixed Deposit',
    processing_time: '1 din', explanation: 'FD todna nahi padega — FD pe hi overdraft le lo, sabse sasta option hai',
  },
  {
    type: 'gold_loan', name: 'Gold Loan',
    interest_rate: 9.5, max_available: 0, collateral_required: 'Physical Gold',
    processing_time: '30 minute', explanation: 'Sone pe loan lo — 30 minute mein paisa mil jaata hai, rate bhi kam hai',
  },
  {
    type: 'personal_loan', name: 'Personal Loan',
    interest_rate: 14.0, max_available: 0, collateral_required: 'None',
    processing_time: '1-2 din', explanation: 'Koi guarantee nahi chahiye, par rate zyada hai — credit card se toh kam hai',
  },
  {
    type: 'credit_card', name: 'Credit Card',
    interest_rate: 36.0, max_available: 0, collateral_required: 'None',
    processing_time: 'Turant', explanation: 'Sabse mehenga option — 36% saalana interest lagta hai, sirf emergency mein use karo',
  },
];

// ─── Portfolio-Backed Credit Line ────────────────────────────────
export async function getPortfolioBackedOptions(userId: string, needAmount: number): Promise<CreditComparison> {
  const fds = await DB.getFDs(userId);
  const sips = await DB.getSIPs(userId);
  const golds = await DB.getGold(userId);

  const totalFD = fds.reduce((s: number, f: any) => s + (f.principal || 0), 0);
  const totalSIP = sips.reduce((s: number, s2: any) => s + (s2.current_value || 0), 0);
  const totalGold = golds.reduce((s: number, g: any) => s + (g.grams || 0) * (g.current_price || g.buy_price || 5000), 0);

  // Calculate max available for each product
  const options: CreditOption[] = CREDIT_PRODUCTS.map(p => {
    let maxAvailable = 0;
    switch (p.type) {
      case 'lamf': maxAvailable = Math.round(totalSIP * 0.70); break; // 70% of MF value
      case 'fd_overdraft': maxAvailable = Math.round(totalFD * 0.90); break; // 90% of FD
      case 'gold_loan': maxAvailable = Math.round(totalGold * 0.75); break; // 75% of gold
      case 'personal_loan': maxAvailable = 500000; break; // Default ₹5L
      case 'credit_card': maxAvailable = 200000; break; // Default ₹2L
    }
    return { ...p, max_available: maxAvailable };
  }).filter(p => p.max_available >= needAmount || p.type === 'personal_loan' || p.type === 'credit_card');

  // Sort by interest rate (cheapest first)
  options.sort((a, b) => a.interest_rate - b.interest_rate);

  const bestOption = options[0] || CREDIT_PRODUCTS[3]; // Default to personal loan

  // Calculate savings vs credit card
  const ccInterest = needAmount * 0.36; // Annual credit card interest
  const bestInterest = needAmount * (bestOption.interest_rate / 100);
  const savingsVsCC = Math.round(ccInterest - bestInterest);

  const voiceExplanation = bestOption.type === 'credit_card'
    ? `Aapke paas koi collateral nahi hai. Credit card hi option hai, par bahut mehenga hai — ₹${Math.round(ccInterest).toLocaleString('en-IN')} saalana interest lagega.`
    : `Aapke ${bestOption.collateral_required} pe ${bestOption.name} le lo — sirf ${bestOption.interest_rate}% interest. Credit card ke ₹${Math.round(ccInterest).toLocaleString('en-IN')} ki jagah sirf ₹${Math.round(bestInterest).toLocaleString('en-IN')} lagega. ₹${savingsVsCC.toLocaleString('en-IN')} bachenge!`;

  return {
    need_amount: needAmount,
    options,
    best_option: bestOption,
    total_savings_vs_credit_card: savingsVsCC,
    voice_explanation: voiceExplanation,
  };
}

// ─── Borrowing Capacity Calculator ───────────────────────────────
export async function calculateBorrowingCapacity(userId: string, monthlyIncome?: number, creditScore?: number): Promise<BorrowingCapacity> {
  const loans = await DB.getLoans(userId);
  const existingEMIs = loans.reduce((s: number, l: any) => s + (l.emi_amount || 0), 0);

  const income = monthlyIncome || 50000;
  const availableEMI = Math.round(income * 0.40 - existingEMIs); // 40% FOIR rule

  // Portfolio for collateral
  const fds = await DB.getFDs(userId);
  const sips = await DB.getSIPs(userId);
  const totalPortfolio = fds.reduce((s: number, f: any) => s + (f.principal || 0), 0) + sips.reduce((s: number, s2: any) => s + (s2.current_value || 0), 0);

  // Loan factors (EMI capacity × factor = max loan)
  const homeLoanFactor = 60; // 20yr at ~8.5%
  const personalLoanFactor = 36; // 3yr at ~14%

  return {
    monthly_income: income,
    existing_emis: existingEMIs,
    available_emi_capacity: Math.max(0, availableEMI),
    max_home_loan: Math.max(0, availableEMI * homeLoanFactor),
    max_personal_loan: Math.max(0, availableEMI * personalLoanFactor),
    max_credit_limit: Math.round(income * 3), // 3x monthly income
    portfolio_backed_amount: Math.round(totalPortfolio * 0.70),
    credit_score: creditScore,
  };
}

// ─── Better-Than-Credit-Card Suggestions ─────────────────────────
export async function suggestCheaperAlternative(userId: string, amount: number): Promise<{
  hasCheaper: boolean;
  suggestion: string;
  interestSaved: number;
  voiceAlert: string;
}> {
  const comparison = await getPortfolioBackedOptions(userId, amount);
  const best = comparison.best_option;

  if (best.type === 'credit_card') {
    return { hasCheaper: false, suggestion: '', interestSaved: 0, voiceAlert: '' };
  }

  const ccCost = Math.round(amount * 0.36);
  const bestCost = Math.round(amount * best.interest_rate / 100);
  const saved = ccCost - bestCost;

  return {
    hasCheaper: true,
    suggestion: best.name,
    interestSaved: saved,
    voiceAlert: `Credit card mat use karo! ${best.name} lo — ${best.interest_rate}% rate hai. ₹${saved.toLocaleString('en-IN')} bachenge 1 saal mein.`,
  };
}

// ─── Voice-Friendly Capacity Summary ─────────────────────────────
export function generateCapacityVoice(cap: BorrowingCapacity): string {
  if (cap.available_emi_capacity <= 0) {
    return `Aapki income aur EMI ke hisaab se abhi aur loan lena risky hai. Pehle existing EMIs kam karo.`;
  }
  return `Aapki income aur EMI ke hisaab se aap ₹${(cap.max_home_loan / 100000).toFixed(0)} lakh tak ka home loan ya ₹${(cap.max_personal_loan / 100000).toFixed(0)} lakh tak ka personal loan le sakte ho. Portfolio pe ₹${(cap.portfolio_backed_amount / 100000).toFixed(0)} lakh milega.`;
}

export default { getPortfolioBackedOptions, calculateBorrowingCapacity, suggestCheaperAlternative, generateCapacityVoice };

// ═══════════════════════════════════════════════════════════════════
// VAANI Idle Money Service — Detect idle balance across accounts
// Voice: "₹12,000 idle hai, liquid fund mein lagaein?"
// ═══════════════════════════════════════════════════════════════════

// ─── Calculate Idle Money ───────────────────────────────────────
// idleMoney = totalBalance - emergencyFund - monthlyBudget - emiBuffer
export function calculateIdleMoney(userData) {
  const {
    totalBankBalance = 0,
    emergencyFundBuffer = 50000,  // Default ₹50k emergency fund
    monthlyBudget = 30000,        // Default ₹30k monthly expenses
    upcomingEMI = 0,              // Upcoming EMI payments
    savingsGoals = 0,             // Money allocated to goals
    lockedInvestments = 0,       // FDs, bonds, etc.
  } = userData;

  // Calculate available balance
  const reservedAmount = emergencyFundBuffer + (monthlyBudget * 2) + upcomingEMI + savingsGoals + lockedInvestments;
  const idleAmount = Math.max(0, totalBankBalance - reservedAmount);

  return {
    totalBalance: totalBankBalance,
    reservedAmount,
    idleAmount,
    suggestion: idleAmount > 5000 
      ? `₹${idleAmount.toLocaleString('en-IN')} ko liquid fund mein lagaayein toh ₹${Math.round(idleAmount * 0.06 / 12).toLocaleString('en-IN')}/mahina extra milega`
      : null,
  };
}

// ─── Get Liquid Fund Recommendation ──────────────────────────────
export function getLiquidFundRecommendation(idleAmount) {
  if (idleAmount < 5000) return null;

  return {
    fundName: 'SBI Liquid Fund',
    fundCode: 103438,
    expectedReturn: 6.5,
    risk: 'Very Low',
    minAmount: 500,
    link: 'https://groww.in/liquid-funds/sbi-liquid-fund-direct-growth',
  };
}

// ─── Format Idle Money Alert ─────────────────────────────────────
export function formatIdleMoneyAlert(idleData, lang = 'en') {
  if (!idleData.suggestion) return null;

  if (lang === 'hi') {
    return `💰 Aapke account mein ₹${idleData.idleAmount.toLocaleString('en-IN')} baith ke khaali hai. Liquid fund mein lagaayein toh mahine mein ₹${Math.round(idleData.idleAmount * 0.06 / 12).toLocaleString('en-IN')} extra milega!`;
  }

  return `💰 You have ₹${idleData.idleAmount.toLocaleString('en-IN')} idle. Put it in liquid fund to earn ₹${Math.round(idleData.idleAmount * 0.06 / 12).toLocaleString('en-IN')}/month extra!`;
}

export default {
  calculateIdleMoney,
  getLiquidFundRecommendation,
  formatIdleMoneyAlert,
};
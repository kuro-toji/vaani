// ═══════════════════════════════════════════════════════════════════
// VAANI Command Center — Net worth, debt tracking, FIRE calculator
// Voice: "Meri total daulat kitni hai?"
// ═══════════════════════════════════════════════════════════════════

// ─── Calculate Net Worth ──────────────────────────────────────────
export function calculateNetWorth(assets, liabilities) {
  const totalAssets = assets.reduce((s, a) => s + parseFloat(a.value || 0), 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + parseFloat(l.outstanding || 0), 0);
  
  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    assetBreakdown: assets,
    liabilityBreakdown: liabilities,
    lastUpdated: new Date().toISOString(),
  };
}

// ─── Get Net Worth Summary ────────────────────────────────────────
export function getNetWorthSummary(portfolio) {
  // Combine all portfolio items
  const assets = [
    // Bank accounts
    { type: 'bank', name: 'Bank Balance', value: portfolio.bankBalance || 0, icon: '🏦' },
    // FDs
    ...(portfolio.fd || []).map(fd => ({
      type: 'fd',
      name: `FD - ${fd.bank || 'Bank'}`,
      value: parseFloat(fd.current_value || fd.principal || 0),
      icon: '🏦',
    })),
    // SIPs
    ...(portfolio.sip || []).map(sip => ({
      type: 'sip',
      name: `SIP - ${sip.fund || sip.fundName || 'Fund'}`,
      value: parseFloat(sip.current_value || sip.principal || 0),
      icon: '📊',
    })),
    // Crypto
    ...(portfolio.crypto || []).map(c => ({
      type: 'crypto',
      name: `${c.coin || c.symbol} Holdings`,
      value: parseFloat(c.current_value || 0),
      icon: '₿',
    })),
    // Gold
    { type: 'gold', name: 'Gold', value: portfolio.goldValue || 0, icon: '🥇' },
    // PPF
    { type: 'ppf', name: 'PPF', value: portfolio.ppfBalance || 0, icon: '📮' },
  ];
  
  const liabilities = [
    // EMIs
    ...(portfolio.emis || []).map(emi => ({
      type: 'emi',
      name: `${emi.type || 'Loan'} - ${emi.lender || 'Bank'}`,
      outstanding: parseFloat(emi.outstanding || 0),
      monthlyEMI: parseFloat(emi.emiAmount || 0),
      icon: '💳',
    })),
    // Credit card dues
    { type: 'credit', name: 'Credit Card Dues', outstanding: portfolio.creditCardDues || 0, icon: '💳' },
  ];
  
  return calculateNetWorth(assets, liabilities);
}

// ─── Calculate FIRE Number ────────────────────────────────────────
export function calculateFIRENumber(targetAge, currentAge, monthlyExpenses, inflationRate = 0.06) {
  // Real monthly expenses adjusted for inflation
  const realMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflationRate, currentAge - 25);
  
  // Annual expenses
  const annualExpenses = realMonthlyExpenses * 12;
  
  // 25x rule (4% withdrawal rate)
  const fireNumber = annualExpenses * 25;
  
  // Years to retirement
  const yearsToRetirement = targetAge - currentAge;
  
  return {
    fireNumber: Math.round(fireNumber),
    monthlyExpenses: Math.round(realMonthlyExpenses),
    annualExpenses: Math.round(annualExpenses),
    yearsToRetirement,
    targetAge,
    currentAge,
    message: `Target ₹${fireNumber.toLocaleString('en-IN')} by age ${targetAge}`,
  };
}

// ─── Calculate FIRE Progress ───────────────────────────────────────
export function calculateFIREProgress(currentNetWorth, fireNumber) {
  const progress = Math.min(100, (currentNetWorth / fireNumber) * 100);
  const remaining = Math.max(0, fireNumber - currentNetWorth);
  
  return {
    progress: Math.round(progress * 10) / 10,
    currentNetWorth,
    fireNumber,
    remaining,
    status: progress >= 100 ? 'Achieved!' : progress >= 75 ? 'Almost there!' : progress >= 50 ? 'On track' : progress >= 25 ? 'Building' : 'Early stage',
  };
}

// ─── Calculate Monthly Savings Needed ─────────────────────────────
export function calculateMonthlySavingsNeeded(fireNumber, currentNetWorth, yearsRemaining, expectedReturn = 0.12) {
  if (yearsRemaining <= 0) return null;
  
  const remainingGoal = fireNumber - currentNetWorth;
  
  if (remainingGoal <= 0) {
    return { monthlySavings: 0, message: 'You have reached your FIRE number!' };
  }
  
  // FV of current net worth at expected return
  const fvCurrent = currentNetWorth * Math.pow(1 + expectedReturn, yearsRemaining);
  
  // PMT formula to find monthly savings
  // FV = PMT * (((1+r)^n - 1) / r)
  // PMT = FV * r / ((1+r)^n - 1)
  const monthlyRate = expectedReturn / 12;
  const months = yearsRemaining * 12;
  const fvRemaining = remainingGoal; // We need this much more
  const monthlySavings = fvRemaining * monthlyRate / (Math.pow(1 + monthlyRate, months) - 1);
  
  return {
    monthlySavings: Math.round(monthlySavings),
    yearlySavings: Math.round(monthlySavings * 12),
    remainingGoal,
    yearsRemaining,
    expectedReturn,
  };
}

// ─── Debt Payoff Strategy ──────────────────────────────────────────
export function getDebtPayoffStrategy(liabilities) {
  if (!liabilities || liabilities.length === 0) return null;
  
  // Sort by interest rate (highest first) - debt avalanche method
  const sortedDebts = [...liabilities].sort((a, b) => 
    parseFloat(b.interestRate || 0) - parseFloat(a.interestRate || 0)
  );
  
  // Calculate total minimum payments
  const totalMinimumPayment = sortedDebts.reduce((s, d) => s + parseFloat(d.monthlyEMI || 0), 0);
  
  // Calculate total interest to be paid
  const totalInterest = sortedDebts.reduce((s, d) => {
    const principal = parseFloat(d.outstanding || 0);
    const emi = parseFloat(d.monthlyEMI || 0);
    const rate = parseFloat(d.interestRate || 0) / 100 / 12;
    const months = parseFloat(d.tenureMonths || 12);
    
    if (rate > 0 && emi > 0) {
      const totalPayment = emi * months;
      return s + (totalPayment - principal);
    }
    return s;
  }, 0);
  
  return {
    debts: sortedDebts,
    totalOutstanding: sortedDebts.reduce((s, d) => s + parseFloat(d.outstanding || 0), 0),
    totalMinimumPayment,
    totalInterest: Math.round(totalInterest),
    payoffOrder: sortedDebts.map(d => d.name || d.type),
    recommendation: 'Focus on highest interest debt first (Debt Avalanche method)',
  };
}

// ─── Spending Analytics ───────────────────────────────────────────
export function getSpendingAnalytics(transactions, monthlyBudget) {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  
  const thisMonthTx = transactions.filter(t => 
    t.date && t.date.startsWith(currentMonth) && t.type === 'debit'
  );
  
  const byCategory = {};
  let totalSpent = 0;
  
  for (const tx of thisMonthTx) {
    const cat = tx.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + Math.abs(tx.amount);
    totalSpent += Math.abs(tx.amount);
  }
  
  const budget = monthlyBudget || 30000;
  const overBudget = totalSpent - budget;
  
  return {
    totalSpent,
    budget,
    remaining: budget - totalSpent,
    overBudget,
    byCategory,
    transactionCount: thisMonthTx.length,
    topCategories: Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amount]) => ({ category: cat, amount: Math.round(amount) })),
    message: overBudget > 0 
      ? `Over budget by ₹${overBudget.toLocaleString('en-IN')}`
      : `Under budget by ₹${(-overBudget).toLocaleString('en-IN')}`,
  };
}

// ─── Format Net Worth for Voice ───────────────────────────────────
export function formatNetWorthVoice(netWorthData, lang = 'en') {
  if (lang === 'hi') {
    return `Aapki kul daulat ₹${netWorthData.netWorth.toLocaleString('en-IN')} hai. Isme ₹${netWorthData.totalAssets.toLocaleString('en-IN')} assets aur ₹${netWorthData.totalLiabilities.toLocaleString('en-IN')} liabilities hain.`;
  }
  return `Your net worth is ₹${netWorthData.netWorth.toLocaleString('en-IN')}. Total assets: ₹${netWorthData.totalAssets.toLocaleString('en-IN')}. Total liabilities: ₹${netWorthData.totalLiabilities.toLocaleString('en-IN')}.`;
}

export default {
  calculateNetWorth,
  getNetWorthSummary,
  calculateFIRENumber,
  calculateFIREProgress,
  calculateMonthlySavingsNeeded,
  getDebtPayoffStrategy,
  getSpendingAnalytics,
  formatNetWorthVoice,
};
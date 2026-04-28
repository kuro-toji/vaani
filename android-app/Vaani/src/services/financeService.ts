// ═══════════════════════════════════════════════════════════════════
// VAANI Finance Calculation Service
// ═══════════════════════════════════════════════════════════════════

// ─── FD Maturity Calculator ─────────────────────────────────────
export function calculateFDMaturity(
  principal: number,
  ratePercent: number,
  tenureMonths: number,
  compoundFreq: 'monthly' | 'quarterly' | 'yearly' = 'quarterly'
): { maturityValue: number; totalInterest: number; tds: number; netMaturity: number } {
  const rate = ratePercent / 100;
  const n = compoundFreq === 'monthly' ? 12 : compoundFreq === 'quarterly' ? 4 : 1;
  const t = tenureMonths / 12;

  // Compound Interest: A = P(1 + r/n)^(nt)
  const maturityValue = principal * Math.pow(1 + rate / n, n * t);
  const totalInterest = maturityValue - principal;

  // TDS calculation
  // Interest > 40k/year (general) or > 50k (senior): 10% TDS
  const yearlyInterest = totalInterest / t;
  let tds = 0;
  if (yearlyInterest > 40000) {
    tds = totalInterest * 0.1; // 10% TDS
  }

  return {
    maturityValue: Math.round(maturityValue),
    totalInterest: Math.round(totalInterest),
    tds: Math.round(tds),
    netMaturity: Math.round(maturityValue - tds),
  };
}

// ─── SIP Projection Calculator ──────────────────────────────────
export function calculateSIPProjection(
  monthlyAmount: number,
  expectedReturnPercent: number,
  tenureMonths: number
): { totalInvested: number; estimatedReturns: number; totalValue: number } {
  const monthlyRate = expectedReturnPercent / 100 / 12;
  const totalInvested = monthlyAmount * tenureMonths;

  // FV = P × [(1+r)^n - 1] / r × (1+r)
  const totalValue = monthlyAmount *
    ((Math.pow(1 + monthlyRate, tenureMonths) - 1) / monthlyRate) *
    (1 + monthlyRate);

  return {
    totalInvested: Math.round(totalInvested),
    estimatedReturns: Math.round(totalValue - totalInvested),
    totalValue: Math.round(totalValue),
  };
}

// ─── XIRR Calculator ───────────────────────────────────────────
export function calculateXIRR(
  cashflows: { amount: number; date: Date }[],
  guess: number = 0.1
): number {
  if (cashflows.length < 2) return 0;

  const maxIterations = 100;
  const tolerance = 0.00001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    const d0 = cashflows[0].date.getTime();

    for (const cf of cashflows) {
      const days = (cf.date.getTime() - d0) / (1000 * 60 * 60 * 24);
      const years = days / 365;
      const factor = Math.pow(1 + rate, years);
      npv += cf.amount / factor;
      dnpv -= (years * cf.amount) / (factor * (1 + rate));
    }

    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < tolerance) {
      return Math.round(newRate * 10000) / 100; // return as percentage
    }
    rate = newRate;
  }

  return Math.round(rate * 10000) / 100;
}

// ─── PPF Calculator ─────────────────────────────────────────────
export function calculatePPF(
  yearlyContribution: number,
  rate: number = 7.1,
  years: number = 15
): { maturityValue: number; totalDeposited: number; totalInterest: number } {
  let balance = 0;
  const r = rate / 100;

  for (let i = 0; i < years; i++) {
    balance = (balance + yearlyContribution) * (1 + r);
  }

  const totalDeposited = yearlyContribution * years;
  return {
    maturityValue: Math.round(balance),
    totalDeposited,
    totalInterest: Math.round(balance - totalDeposited),
  };
}

// ─── FD Ladder Optimizer ────────────────────────────────────────
export function optimizeFDLadder(
  totalAmount: number,
  targetTenures: number[] = [12, 24, 36, 48, 60], // months
  bankRates: { bank: string; rates: { tenure: string; rate: number }[] }[]
): { bank: string; amount: number; tenure: number; rate: number; maturityValue: number }[] {
  const splitAmount = Math.floor(totalAmount / targetTenures.length);
  const ladder: any[] = [];

  for (const tenure of targetTenures) {
    // Find best rate for this tenure
    let bestBank = bankRates[0].bank;
    let bestRate = 0;

    for (const bank of bankRates) {
      const tenureStr = `${tenure / 12}Y`;
      const rateEntry = bank.rates.find(r => r.tenure === tenureStr);
      if (rateEntry && rateEntry.rate > bestRate) {
        bestRate = rateEntry.rate;
        bestBank = bank.bank;
      }
    }

    const maturity = calculateFDMaturity(splitAmount, bestRate, tenure);

    ladder.push({
      bank: bestBank,
      amount: splitAmount,
      tenure,
      rate: bestRate,
      maturityValue: maturity.maturityValue,
    });
  }

  return ladder;
}

// ─── Days Until Maturity ────────────────────────────────────────
export function daysUntilMaturity(maturityDate: string): number {
  const maturity = new Date(maturityDate);
  const today = new Date();
  const diff = maturity.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Format Currency (Indian format) ────────────────────────────
export function formatCurrency(amount: number, compact: boolean = false): string {
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Monthly Budget Utilization ─────────────────────────────────
export function calculateBudgetUtilization(
  budgets: { category: string; monthly_limit: number; spent: number }[]
): { category: string; limit: number; spent: number; percentage: number; status: 'safe' | 'warning' | 'danger' }[] {
  return budgets.map(b => {
    const pct = b.monthly_limit > 0 ? (b.spent / b.monthly_limit) * 100 : 0;
    return {
      category: b.category,
      limit: b.monthly_limit,
      spent: b.spent,
      percentage: Math.round(pct),
      status: pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe',
    };
  });
}

// ─── Net Worth Change ───────────────────────────────────────────
export function calculateNetWorthChange(
  current: number,
  previous: number
): { change: number; percentage: number; direction: 'up' | 'down' | 'same' } {
  const change = current - previous;
  const percentage = previous > 0 ? (change / previous) * 100 : 0;
  return {
    change,
    percentage: Math.round(percentage * 10) / 10,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
  };
}

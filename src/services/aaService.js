/**
 * Account Aggregator Mock Service
 * Simulates India's Account Aggregator (AA) framework:
 * Consent → Data Fetch → Auto-Analysis
 */

const MOCK_BANKS = [
  { id: 'sbi', name: 'State Bank of India', logo: '🏦' },
  { id: 'hdfc', name: 'HDFC Bank', logo: '🏪' },
  { id: 'icici', name: 'ICICI Bank', logo: '🏢' },
  { id: 'pnb', name: 'Punjab National Bank', logo: '🏛️' },
  { id: 'bob', name: 'Bank of Baroda', logo: '🏦' },
  { id: 'canara', name: 'Canara Bank', logo: '🏦' },
  { id: 'kotak', name: 'Kotak Mahindra', logo: '🏪' },
  { id: 'axis', name: 'Axis Bank', logo: '🏢' },
];

function generateMockPortfolio(bankId) {
  const base = Math.floor(Math.random() * 500000) + 50000;
  return {
    bankName: MOCK_BANKS.find(b => b.id === bankId)?.name || 'Unknown Bank',
    accounts: [
      {
        type: 'Savings',
        accountNumber: `XXXX${Math.floor(1000 + Math.random() * 9000)}`,
        balance: base,
        lastTransactionDate: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString().split('T')[0],
      },
      ...(Math.random() > 0.5 ? [{
        type: 'Fixed Deposit',
        accountNumber: `XXXX${Math.floor(1000 + Math.random() * 9000)}`,
        balance: Math.floor(base * 2.5),
        maturityDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        interestRate: (6.5 + Math.random() * 1.5).toFixed(1) + '%',
      }] : []),
    ],
    totalBalance: 0,
    monthlyIncome: Math.floor(25000 + Math.random() * 75000),
    monthlyExpenses: Math.floor(15000 + Math.random() * 45000),
    savingsRate: 0,
    recentTransactions: [
      { date: '2026-04-10', desc: 'UPI/GPAY', amount: -1250, type: 'debit' },
      { date: '2026-04-08', desc: 'SALARY', amount: Math.floor(25000 + Math.random() * 75000), type: 'credit' },
      { date: '2026-04-05', desc: 'ELECTRICITY', amount: -2100, type: 'debit' },
      { date: '2026-04-02', desc: 'ATM WITHDRAWAL', amount: -5000, type: 'debit' },
      { date: '2026-03-28', desc: 'UPI/PHONEPE', amount: -890, type: 'debit' },
    ],
  };
}

export function getBanksList() {
  return MOCK_BANKS;
}

/**
 * Simulate OTP verification
 */
export function verifyOTP(otp) {
  // Any 6-digit OTP is "valid" for demo
  return /^\d{6}$/.test(otp);
}

/**
 * Simulate fetching account data after consent
 * Returns a promise that resolves after a fake delay
 */
export function fetchAccountData(bankId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const portfolio = generateMockPortfolio(bankId);
      // Calculate totals
      portfolio.totalBalance = portfolio.accounts.reduce((sum, a) => sum + a.balance, 0);
      portfolio.savingsRate = Math.round(
        ((portfolio.monthlyIncome - portfolio.monthlyExpenses) / portfolio.monthlyIncome) * 100
      );
      resolve(portfolio);
    }, 2000); // 2 second fake network delay
  });
}

/**
 * Analyze fetched portfolio and generate recommendations
 */
export function analyzePortfolio(portfolio) {
  const recommendations = [];
  
  if (portfolio.savingsRate < 20) {
    recommendations.push({
      priority: 'high',
      emoji: '⚠️',
      text: `आपकी बचत दर ${portfolio.savingsRate}% है। कम से कम 20% बचाने का लक्ष्य रखें।`,
    });
  } else {
    recommendations.push({
      priority: 'low',
      emoji: '✅',
      text: `बहुत अच्छा! आपकी बचत दर ${portfolio.savingsRate}% है।`,
    });
  }
  
  const hasFD = portfolio.accounts.some(a => a.type === 'Fixed Deposit');
  if (!hasFD && portfolio.totalBalance > 100000) {
    recommendations.push({
      priority: 'medium',
      emoji: '💡',
      text: 'आपके बचत खाते में ₹1 लाख+ है। FD में डालकर ज्यादा ब्याज कमाएं।',
    });
  }
  
  if (portfolio.totalBalance < 50000) {
    recommendations.push({
      priority: 'high',
      emoji: '🆘',
      text: 'आपातकालीन फंड बनाएं — कम से कम 3 महीने का खर्चा बचाएं।',
    });
  }
  
  return recommendations;
}

export default { getBanksList, verifyOTP, fetchAccountData, analyzePortfolio };

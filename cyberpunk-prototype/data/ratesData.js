export const ratesData = {
  fd: {
    banks: [
      { name: "SBI", rates: { "1yr": 6.8, "2yr": 7.0, "3yr": 6.75, "5yr": 6.5 }, seniorExtra: 0.5 },
      { name: "HDFC Bank", rates: { "1yr": 6.6, "2yr": 7.0, "3yr": 7.0, "5yr": 7.0 }, seniorExtra: 0.5 },
      { name: "ICICI Bank", rates: { "1yr": 6.7, "2yr": 7.0, "3yr": 7.0, "5yr": 7.0 }, seniorExtra: 0.5 },
      { name: "Axis Bank", rates: { "1yr": 6.7, "2yr": 7.1, "3yr": 7.1, "5yr": 7.0 }, seniorExtra: 0.5 },
      { name: "PNB", rates: { "1yr": 6.5, "2yr": 6.8, "3yr": 6.5, "5yr": 6.5 }, seniorExtra: 0.5 },
      { name: "Bank of Baroda", rates: { "1yr": 6.85, "2yr": 7.0, "3yr": 7.15, "5yr": 6.5 }, seniorExtra: 0.5 },
      { name: "Canara Bank", rates: { "1yr": 6.85, "2yr": 6.85, "3yr": 6.85, "5yr": 6.7 }, seniorExtra: 0.5 },
      { name: "Post Office TD", rates: { "1yr": 6.9, "2yr": 7.0, "3yr": 7.1, "5yr": 7.5 }, seniorExtra: 0 }
    ],
    tdsThreshold: 40000,
    tdsThresholdSenior: 50000,
    tdsRate: 10
  },
  postOffice: {
    ppf: { rate: 7.1, lockIn: "15 years", minAmount: 500, maxAmount: 150000, taxStatus: "EEE", partialWithdrawal: "From year 7" },
    nsc: { rate: 7.7, lockIn: "5 years", taxStatus: "80C deduction on investment, interest taxable" },
    kvp: { rate: 7.5, doublingMonths: 115, lockIn: "2.5 years minimum" },
    sukanyaSamridhi: { rate: 8.2, forAge: "Girl child below 10 years", maturity: "21 years", maxAmount: 150000, taxStatus: "EEE" },
    scss: { rate: 8.2, forAge: "60+", tenure: "5 years", maxAmount: 3000000, payoutFrequency: "Quarterly", taxBenefit: "80C" },
    rd: { rate: 6.7, tenure: "5 years", compounding: "Quarterly", minAmount: 100 },
    mahilaSamman: { rate: 7.5, forGender: "Women only", maxAmount: 200000, tenure: "2 years" }
  },
  mutualFunds: {
    sip: { minAmount: 100, frequency: "Monthly" },
    categories: [
      { type: "Index Fund", risk: "Medium", horizon: "5+ years", expectedReturn: "10-12%", expenseRatio: "0.1-0.2%", note: "Tracks Nifty 50 or Sensex. Best for beginners." },
      { type: "Equity Fund", risk: "High", horizon: "7+ years", expectedReturn: "12-15%", note: "Not guaranteed. Market linked." },
      { type: "Debt Fund", risk: "Low", horizon: "3+ years", expectedReturn: "6-8%", note: "Better than FD for 3+ year horizon after indexation." },
      { type: "ELSS", risk: "High", horizon: "3+ years (lock-in)", taxBenefit: "80C", note: "Shortest lock-in among 80C options." },
      { type: "Liquid Fund", risk: "Very Low", horizon: "Any", expectedReturn: "6.5-7%", withdrawalTime: "1 working day", note: "Best place for emergency fund." }
    ],
    importantDisclaimer: "Mutual fund returns are NOT guaranteed. Past performance does not guarantee future results. Market linked investments carry risk."
  },
  gold: [
    { type: "Sovereign Gold Bond (SGB)", additionalInterest: "2.5% per year on issue price", storageRisk: false, makingCharges: false, taxOnMaturity: "Tax free if held 8 years", recommendation: "Best form of gold investment" },
    { type: "Gold ETF", exchange: true, demat: true, expenseRatio: "Low", storageRisk: false },
    { type: "Digital Gold", minAmount: 1, storageRisk: false, platformRisk: true },
    { type: "Physical Gold", makingCharges: "10-20% loss at purchase", storageRisk: true, emotionalValue: true }
  ],
  insurance: [
    { type: "Term Insurance", purpose: "Pure life cover", returns: "None (pays only on death)", cost: "Low — ₹10,000-15,000/year for ₹1cr cover at age 30", recommendation: "Only life insurance most people need" },
    { type: "Endowment / Money Back", purpose: "Insurance + savings combined", returns: "4-5% — very low", recommendation: "Generally poor value. Buy term + invest separately instead." },
    { type: "ULIP", purpose: "Insurance + market investment", charges: "High in first 5 years", recommendation: "Inferior to term + mutual fund combination." },
    { type: "Health Insurance", purpose: "Medical expenses cover", minimumCover: "₹5-10 lakh family floater", recommendation: "Everyone needs this. Non-negotiable." }
  ]
}

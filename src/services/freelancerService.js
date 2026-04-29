// ═══════════════════════════════════════════════════════════════════
// VAANI Freelancer OS — Income logging, GST invoice, ITR export
// Voice: "Rahul ne ₹25,000 bheja" → logs income
// ═══════════════════════════════════════════════════════════════════

// ─── Income Entry ────────────────────────────────────────────────
export function createIncomeEntry(data) {
  const { clientName, amount, date, description, category } = data;
  
  const isTDSAplicable = amount > 30000 || data.annualFromClient > 100000;
  const tdsAmount = isTDSAplicable ? amount * 0.10 : 0;
  
  return {
    id: `inc_${Date.now()}`,
    clientName,
    amount,
    date: date || new Date().toISOString(),
    description: description || '',
    category: category || 'freelance',
    tdsApplicable: isTDSAplicable,
    tdsAmount,
    netAmount: amount - tdsAmount,
    status: 'received',
    createdAt: new Date().toISOString(),
  };
}

// ─── Client Summary ──────────────────────────────────────────────
export function getClientSummary(incomes) {
  const clients = {};
  
  for (const income of incomes) {
    if (!clients[income.clientName]) {
      clients[income.clientName] = {
        name: income.clientName,
        totalIncome: 0,
        totalTDS: 0,
        count: 0,
        lastPayment: null,
        outstanding: 0,
      };
    }
    
    clients[income.clientName].totalIncome += income.amount;
    clients[income.clientName].totalTDS += income.tdsAmount || 0;
    clients[income.clientName].count += 1;
    
    const paymentDate = new Date(income.date);
    if (!clients[income.clientName].lastPayment || paymentDate > new Date(clients[income.clientName].lastPayment)) {
      clients[income.clientName].lastPayment = income.date;
    }
  }
  
  return Object.values(clients).sort((a, b) => b.totalIncome - a.totalIncome);
}

// ─── Generate GST Invoice ────────────────────────────────────────
export function generateGSTInvoice(data) {
  const {
    invoiceNumber,
    clientName,
    clientAddress,
    clientGSTIN,
    yourGSTIN,
    services,
    totalAmount,
    date,
  } = data;
  
  const sgstRate = 9;
  const cgstRate = 9;
  const sgst = totalAmount * (sgstRate / 100);
  const cgst = totalAmount * (cgstRate / 100);
  const totalWithTax = totalAmount + sgst + cgst;
  
  return {
    invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
    date: date || new Date().toISOString(),
    from: {
      name: 'Your Business Name',
      address: 'Your Address',
      gstin: yourGSTIN || '',
    },
    to: {
      name: clientName,
      address: clientAddress || '',
      gstin: clientGSTIN || '',
    },
    services: services || [{ description: 'Professional Services', amount: totalAmount }],
    subtotal: totalAmount,
    sgst: Math.round(sgst * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    total: Math.round(totalWithTax * 100) / 100,
    sgstRate,
    cgstRate,
  };
}

// ─── ITR Data Export ──────────────────────────────────────────────
export function exportITRData(incomes, expenses, deductions) {
  // Calculate totals
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netIncome = totalIncome - totalExpenses;
  
  // Income by client
  const incomeByClient = {};
  for (const income of incomes) {
    incomeByClient[income.clientName] = (incomeByClient[income.clientName] || 0) + income.amount;
  }
  
  // TDS汇总
  const totalTDS = incomes.reduce((s, i) => s + (i.tdsAmount || 0), 0);
  
  return {
    financialYear: '2024-25',
    totalGrossIncome: totalIncome,
    totalExpenses,
    netProfit: netIncome,
    totalTDS,
    totalAdvanceTax: 0,
    incomeByClient,
    deductions,
    exportDate: new Date().toISOString(),
    format: 'ITR-3', // For freelancers
  };
}

// ─── Parse Voice Income Entry ─────────────────────────────────────
export function parseVoiceIncome(text) {
  // Patterns: "Rahul ne ₹25,000 bheja", "client payment 50000", "swiggy 3400 aaya"
  const patterns = [
    /([A-Za-z]+)\s+ne\s+₹?([\d,]+)\s+(?:bheja|pay|diya|transfer)/i,
    /₹?([\d,]+)\s+from\s+([A-Za-z]+)/i,
    /([A-Za-z]+)\s+₹?([\d,]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        clientName: match[1] || match[2],
        amount: parseInt(match[2] || match[1], 10),
      };
    }
  }
  
  return null;
}

// ─── TDS Threshold Alert ─────────────────────────────────────────
export function checkTDSThreshold(clientAnnualTotal) {
  if (clientAnnualTotal >= 100000) {
    return {
      alert: true,
      message: `Client has paid ₹${clientAnnualTotal.toLocaleString('en-IN')} this year. Ask for Form 16A.`,
      action: 'Request TDS Certificate',
    };
  }
  return { alert: false };
}

export default {
  createIncomeEntry,
  getClientSummary,
  generateGSTInvoice,
  exportITRData,
  parseVoiceIncome,
  checkTDSThreshold,
};
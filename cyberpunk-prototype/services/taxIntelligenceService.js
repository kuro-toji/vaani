// ═══════════════════════════════════════════════════════════════════
// VAANI Tax Intelligence Service — Tax harvesting, advance tax, TDS detection
// Voice: "3 din ruko — LTCG ho jayega, ₹X bachenge"
// ═══════════════════════════════════════════════════════════════════

// ─── Calculate Capital Gains ─────────────────────────────────────
export function calculateCapitalGains(purchasePrice, currentValue, holdingDays) {
  const gain = currentValue - purchasePrice;
  const isLongTerm = holdingDays >= 365;
  
  // Tax rates
  const stcgRate = 20; // Short term 20%
  const ltcgRate = 12.5; // Long term 12.5% (above ₹1.25L exemption)
  
  let tax = 0;
  let taxType = '';
  
  if (gain <= 0) {
    return { gain, tax: 0, taxType: 'None', message: 'No capital gain' };
  }
  
  if (isLongTerm) {
    const taxableGain = Math.max(0, gain - 125000); // ₹1.25L exemption
    tax = taxableGain * (ltcgRate / 100);
    taxType = 'LTCG';
  } else {
    tax = gain * (stcgRate / 100);
    taxType = 'STCG';
  }
  
  return {
    gain,
    tax: Math.round(tax),
    taxType,
    isLongTerm,
    holdingDays,
    message: isLongTerm
      ? `LTCG: Pay ${taxType} only after 1 year. Save ₹${Math.round(gain * 0.075).toLocaleString('en-IN')} vs STCG`
      : `STCG: Wait ${365 - holdingDays} more days for LTCG to save ₹${Math.round(gain * 0.075).toLocaleString('en-IN')}`,
  };
}

// ─── Get Tax Harvesting Opportunity ───────────────────────────────
export function getTaxHarvestingOpportunity(investments) {
  const opportunities = [];
  
  for (const inv of investments) {
    if (inv.unrealizedGain > 0 && inv.holdingDays >= 365) {
      // Check if there's a loss to offset
      const potentialTax = inv.unrealizedGain * 0.125;
      if (potentialTax > 0) {
        opportunities.push({
          symbol: inv.symbol || inv.fundName,
          gain: inv.unrealizedGain,
          potentialTaxSaving: Math.round(potentialTax),
          message: `Sell to save ₹${Math.round(potentialTax).toLocaleString('en-IN')} in taxes`,
        });
      }
    }
  }
  
  return opportunities.sort((a, b) => b.potentialTaxSaving - a.potentialTaxSaving);
}

// ─── Calculate Advance Tax ───────────────────────────────────────
export function calculateAdvanceTax(incomeData) {
  const {
    annualIncome = 0,
    existingTDS = 0,
    deductions80C = 0,   // Max ₹1,50,000
    deductions80D = 0,   // Max ₹25,000 (self) + ₹50,000 (parents)
    deductions80CCD1B = 0, // Max ₹50,000
    otherDeductions = 0,
  } = incomeData;
  
  // Calculate taxable income
  const totalDeductions = Math.min(deductions80C, 150000) + 
                          Math.min(deductions80D, 75000) + 
                          Math.min(deductions80CCD1B, 50000) + 
                          otherDeductions;
  const taxableIncome = Math.max(0, annualIncome - totalDeductions - 500000); // ₹5L exemption
  
  // Calculate tax
  let tax = 0;
  if (taxableIncome <= 0) {
    tax = 0;
  } else if (taxableIncome <= 300000) {
    tax = taxableIncome * 0.05;
  } else if (taxableIncome <= 600000) {
    tax = 15000 + (taxableIncome - 300000) * 0.10;
  } else if (taxableIncome <= 900000) {
    tax = 45000 + (taxableIncome - 600000) * 0.15;
  } else if (taxableIncome <= 1200000) {
    tax = 90000 + (taxableIncome - 900000) * 0.20;
  } else {
    tax = 150000 + (taxableIncome - 1200000) * 0.30;
  }
  
  // Add cess
  const totalTax = Math.round(tax * 1.04);
  const balanceTax = Math.max(0, totalTax - existingTDS);
  
  // Advance tax deadlines
  const deadline1 = { date: 'June 15', amount: Math.round(totalTax * 0.15) };
  const deadline2 = { date: 'September 15', amount: Math.round(totalTax * 0.45) - deadline1.amount };
  const deadline3 = { date: 'December 15', amount: Math.round(totalTax * 0.75) - deadline1.amount - deadline2.amount };
  const deadline4 = { date: 'March 15', amount: Math.max(0, totalTax - existingTDS - deadline1.amount - deadline2.amount - deadline3.amount) };
  
  return {
    annualIncome,
    totalDeductions,
    taxableIncome,
    totalTax,
    existingTDS,
    balanceTax,
    deadlines: [deadline1, deadline2, deadline3, deadline4],
  };
}

// ─── TDS Detection ───────────────────────────────────────────────
export function detectTDS(paymentAmount, annualIncomeFromClient = 0) {
  const singlePaymentThreshold = 30000; // TDS if single payment > ₹30,000
  const annualThreshold = 100000; // TDS if annual from one client > ₹1L
  
  const alerts = [];
  
  if (paymentAmount > singlePaymentThreshold) {
    const tdsRate = 0.10; // 10% TDS on professional services
    const tdsAmount = paymentAmount * tdsRate;
    alerts.push({
      type: 'single_payment',
      message: `TDS ₹${tdsAmount.toLocaleString('en-IN')} deducted on this ₹${paymentAmount.toLocaleString('en-IN')} payment`,
      tdsAmount,
    });
  }
  
  if (annualIncomeFromClient > annualThreshold) {
    alerts.push({
      type: 'annual_threshold',
      message: `Client has paid ₹${annualIncomeFromClient.toLocaleString('en-IN')} this year. TDS certificate (Form 16A) should be collected.`,
    });
  }
  
  return alerts;
}

// ─── Year-End Tax Saving Suggestions ─────────────────────────────
export function getYearEndTaxSavingSuggestions(incomeData) {
  const suggestions = [];
  
  const { deductions80C = 0, annualIncome = 0 } = incomeData;
  const remaining80C = Math.max(0, 150000 - deductions80C);
  
  if (remaining80C > 0) {
    suggestions.push({
      section: '80C',
      remaining: remaining80C,
      options: ['ELSS Mutual Funds', 'PPF', 'NSC', 'Life Insurance', 'Home Loan Principal'],
      bestOption: 'ELSS Mutual Funds - 3 year lock-in + potential 15% returns',
    });
  }
  
  const remaining80D = Math.max(0, 25000 - (incomeData.deductions80D || 0));
  if (remaining80D > 0 && annualIncome > 100000) {
    suggestions.push({
      section: '80D',
      remaining: remaining80D,
      options: ['Health Insurance Premium'],
      bestOption: 'Health Insurance - ₹25,000 deduction + tax-free claim',
    });
  }
  
  const remaining80CCD = Math.max(0, 50000 - (incomeData.deductions80CCD1B || 0));
  if (remaining80CCD > 0) {
    suggestions.push({
      section: '80CCD(1B)',
      remaining: remaining80CCD,
      options: ['NPS Contribution'],
      bestOption: 'NPS - Extra ₹50,000 deduction over 80C limit',
    });
  }
  
  return suggestions;
}

export default {
  calculateCapitalGains,
  getTaxHarvestingOpportunity,
  calculateAdvanceTax,
  detectTDS,
  getYearEndTaxSavingSuggestions,
};
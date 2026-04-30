// ═══════════════════════════════════════════════════════════════════
// VAANI Tax Engine Route — Layer 4
// Real tax computation, advance tax, LTCG harvesting, TDS detection
// ═══════════════════════════════════════════════════════════════════

import express from 'express';

const router = express.Router();

// ─── Full Tax Computation ───────────────────────────────────────────
router.get('/compute/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch user data from Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Get portfolio for capital gains
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);
    
    // Get transactions for income
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100);
    
    // Get profile for deductions
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // Calculate gross income
    const incomeData = calculateGrossIncome(portfolio || [], transactions || [], profile);
    
    // Calculate deductions
    const deductionsData = calculateDeductions(portfolio || [], profile);
    
    // Calculate tax
    const taxResult = calculateTax(incomeData, deductionsData);
    
    // Advance tax schedule
    const advanceTax = calculateAdvanceTaxSchedule(taxResult.totalTax, incomeData.existingTDS);
    
    // LTCG harvesting opportunities
    const harvestingOpportunities = calculateHarvesting(portfolio || []);
    
    res.json({
      grossIncome: incomeData,
      deductions: deductionsData,
      tax: taxResult,
      advanceTaxSchedule: advanceTax,
      ltcgHarvesting: harvestingOpportunities,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[TaxEngine] Compute error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Calculate Gross Income ─────────────────────────────────────────
function calculateGrossIncome(portfolio, transactions, profile) {
  // Salary income from profile
  const salaryIncome = profile?.annual_income || 0;
  
  // Freelance income from transactions
  const freelanceIncomes = (transactions || []).filter(t => 
    t.category === 'freelance' || t.type === 'credit' && t.description?.includes('client')
  );
  const freelanceIncome = freelanceIncomes.reduce((s, t) => s + Math.abs(parseFloat(t.amount || 0)), 0);
  
  // FD interest income
  const fds = (portfolio || []).filter(p => p.type === 'fd');
  const fdInterest = fds.reduce((s, fd) => {
    const principal = parseFloat(fd.principal || 0);
    const rate = parseFloat(fd.rate || 0) / 100;
    const tenure = parseFloat(fd.tenure_years || 1);
    return s + (principal * rate * tenure);
  }, 0);
  
  // Capital gains from SIP
  const sips = (portfolio || []).filter(p => p.type === 'sip');
  const sipGains = sips.reduce((s, sip) => {
    const invested = parseFloat(sip.principal || 0);
    const current = parseFloat(sip.current_value || invested);
    return s + Math.max(0, current - invested);
  }, 0);
  
  // Crypto gains
  const cryptos = (portfolio || []).filter(p => p.type === 'crypto');
  const cryptoGains = cryptos.reduce((s, c) => {
    const invested = parseFloat(c.principal || 0);
    const current = parseFloat(c.current_value || invested);
    return s + Math.max(0, current - invested);
  }, 0);
  
  const totalIncome = salaryIncome + freelanceIncome + fdInterest + sipGains + cryptoGains;
  
  return {
    salary: Math.round(salaryIncome),
    freelance: Math.round(freelanceIncome),
    fdInterest: Math.round(fdInterest),
    sipGains: Math.round(sipGains),
    cryptoGains: Math.round(cryptoGains),
    total: Math.round(totalIncome),
    existingTDS: profile?.tds_deducted || 0,
  };
}

// ─── Calculate Deductions ───────────────────────────────────────────
function calculateDeductions(portfolio, profile) {
  // 80C: ELSS + PPF + Insurance
  const sips80C = (portfolio || []).filter(p => p.type === 'sip' && p.section === '80c');
  const elssAmount = sips80C.reduce((s, p) => s + parseFloat(p.principal || 0), 0);
  const ppfAmount = profile?.ppf_contribution || 0;
  const insurancePremium = profile?.life_insurance_premium || 0;
  const section80C = Math.min(elssAmount + ppfAmount + insurancePremium, 150000);
  
  // 80D: Health Insurance
  const section80D = Math.min(profile?.health_insurance_premium || 0, 25000);
  const section80DParents = Math.min(profile?.parent_health_insurance || 0, 50000);
  
  // 80CCD(1B): NPS
  const section80CCD = Math.min(profile?.nps_contribution || 0, 50000);
  
  // Standard deduction
  const standardDeduction = 75000;
  
  const totalDeductions = section80C + section80D + section80DParents + section80CCD + standardDeduction;
  
  return {
    section80C: { claimed: section80C, limit: 150000, breakdown: { elss: elssAmount, ppf: ppfAmount, insurance: insurancePremium } },
    section80D: { claimed: section80D + section80DParents, limit: section80DParents > 0 ? 75000 : 25000, health: section80D, parents: section80DParents },
    section80CCD1B: { claimed: section80CCD, limit: 50000 },
    standardDeduction: standardDeduction,
    total: totalDeductions,
  };
}

// ─── Calculate Tax (New Regime FY 2024-25) ─────────────────────────
function calculateTax(incomeData, deductionsData) {
  const taxableIncome = Math.max(0, incomeData.total - deductionsData.total);
  
  let tax = 0;
  
  if (taxableIncome <= 300000) {
    tax = 0;
  } else if (taxableIncome <= 600000) {
    tax = (taxableIncome - 300000) * 0.05;
  } else if (taxableIncome <= 900000) {
    tax = 15000 + (taxableIncome - 600000) * 0.10;
  } else if (taxableIncome <= 1200000) {
    tax = 45000 + (taxableIncome - 900000) * 0.15;
  } else if (taxableIncome <= 1500000) {
    tax = 90000 + (taxableIncome - 1200000) * 0.20;
  } else {
    tax = 150000 + (taxableIncome - 1500000) * 0.30;
  }
  
  // 4% education cess
  const cess = tax * 0.04;
  const totalTax = Math.round(tax + cess);
  const balanceTax = Math.max(0, totalTax - incomeData.existingTDS);
  
  // Old regime comparison (approx)
  const oldRegimeTax = calculateOldRegimeTax(incomeData.total, deductionsData);
  
  return {
    taxableIncome,
    taxBeforeCess: Math.round(tax),
    cess: Math.round(cess),
    totalTax,
    existingTDS: incomeData.existingTDS,
    balanceTax,
    effectiveRate: taxableIncome > 0 ? Math.round((totalTax / taxableIncome) * 10000) / 100 : 0,
    oldRegimeTax: Math.round(oldRegimeTax),
    recommendedRegime: totalTax <= oldRegimeTax ? 'new' : 'old',
    savings: Math.abs(Math.round(oldRegimeTax - totalTax)),
  };
}

// ─── Old Regime Tax (rough estimate) ────────────────────────────────
function calculateOldRegimeTax(totalIncome, deductionsData) {
  // Old regime has higher tax but allows more deductions
  const taxableIncome = Math.max(0, totalIncome - 50000 - deductionsData.total); // 50K standard deduction
  
  if (taxableIncome <= 250000) return 0;
  if (taxableIncome <= 500000) return (taxableIncome - 250000) * 0.05;
  if (taxableIncome <= 1000000) return 12500 + (taxableIncome - 500000) * 0.20;
  
  const tax = 112500 + (taxableIncome - 1000000) * 0.30;
  return tax + tax * 0.04; // + cess
}

// ─── Advance Tax Schedule ───────────────────────────────────────────
function calculateAdvanceTaxSchedule(totalTax, existingTDS) {
  const balance = Math.max(0, totalTax - existingTDS);
  
  if (balance <= 0) return { noAdvanceTax: true };
  
  return {
    noAdvanceTax: false,
    totalAdvanceTax: balance,
    installments: [
      { deadline: 'June 15', dueDate: '2025-06-15', percentage: 15, amount: Math.round(balance * 0.15), paid: false },
      { deadline: 'September 15', dueDate: '2025-09-15', percentage: 45, amount: Math.round(balance * 0.45) - Math.round(balance * 0.15), paid: false },
      { deadline: 'December 15', dueDate: '2025-12-15', percentage: 75, amount: Math.round(balance * 0.75) - Math.round(balance * 0.45), paid: false },
      { deadline: 'March 15', dueDate: '2026-03-15', percentage: 100, amount: Math.max(0, balance - Math.round(balance * 0.75)), paid: false },
    ],
    warning: balance > 50000 ? 'Consult a CA for advance tax if income is from business/profession' : null,
  };
}

// ─── LTCG Harvesting Opportunities ─────────────────────────────────
function calculateHarvesting(portfolio) {
  const opportunities = [];
  
  const sips = (portfolio || []).filter(p => p.type === 'sip');
  
  for (const sip of sips) {
    const invested = parseFloat(sip.principal || 0);
    const current = parseFloat(sip.current_value || invested);
    const holdingDays = sip.holding_days || 365;
    const gain = current - invested;
    
    if (gain <= 0) continue;
    
    if (holdingDays >= 365) {
      // Already LTCG — check if under ₹1.25L exemption
      const taxableLTCG = Math.max(0, gain - 125000);
      const taxSaved = taxableLTCG > 0 ? Math.round(taxableLTCG * 0.125) : 0;
      
      if (taxableLTCG > 0) {
        opportunities.push({
          type: 'book_profit',
          fundName: sip.fund || sip.scheme_name || 'SIP',
          gain: Math.round(gain),
          holdingDays,
          status: 'LTCG — eligible',
          action: 'Book profit up to ₹1.25L tax-free',
          taxSavings: taxSaved > 0 ? taxSaved : 0,
          message: `₹${gain.toLocaleString('en-IN')} LTCG mein hai — ₹1.25L tak tax-free book kar sakte ho. ₹${taxSaved} tax bachega!`,
        });
      }
    } else {
      // STCG — wait for LTCG
      const daysToLTCG = 365 - holdingDays;
      const potentialTaxSaving = Math.round(gain * 0.075); // STCG 20% vs LTCG 12.5%
      
      opportunities.push({
        type: 'wait_for_ltcg',
        fundName: sip.fund || sip.scheme_name || 'SIP',
        gain: Math.round(gain),
        holdingDays,
        daysToLTCG,
        status: 'STCG',
        action: `Wait ${daysToLTCG} more days for LTCG`,
        taxSavings: potentialTaxSaving,
        message: `${daysToLTCG} din aur ruko — LTCG ho jayega. ₹${potentialTaxSaving} tax bachega!`,
      });
    }
  }
  
  return opportunities.sort((a, b) => b.taxSavings - a.taxSavings);
}

// ─── TDS Detection for Freelancers ─────────────────────────────────
router.get('/tds-check/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
    
    // Get all clients and their annual totals
    const { data: clients } = await supabase
      .from('freelancer_clients')
      .select('*')
      .eq('user_id', userId);
    
    const tdsAlerts = [];
    
    for (const client of (clients || [])) {
      if (client.annual_total >= 100000) {
        tdsAlerts.push({
          client: client.client_name,
          annualTotal: client.annual_total,
          status: 'TDS_APPLIES',
          message: `₹${client.annual_total.toLocaleString('en-IN')} — client ko PAN do, Form 16A collect karo`,
          tdsRate: '10%',
          tdsAmount: Math.round(client.annual_total * 0.10),
        });
      } else if (client.annual_total >= 70000) {
        tdsAlerts.push({
          client: client.client_name,
          annualTotal: client.annual_total,
          status: 'NEAR_THRESHOLD',
          remaining: Math.round(100000 - client.annual_total),
          message: `₹${Math.round(100000 - client.annual_total).toLocaleString('en-IN')} aur — TDS threshold complete`,
        });
      }
    }
    
    res.json({
      alerts: tdsAlerts,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[TaxEngine] TDS check error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
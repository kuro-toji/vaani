/**
 * FD Comparator Service
 * Compares Fixed Deposit rates across banks for given tenure.
 */

import { FD_RATES, TENURE_LABELS } from '../data/fdRates.js';

/**
 * Compare FD rates for a given tenure.
 * 
 * @param {Object} params
 * @param {string} params.tenure - Tenure key (e.g. '1y', '3y-5y', '9m-1y')
 * @param {number} params.amount - Deposit amount (optional, for display)
 * @param {boolean} params.isSenior - Is senior citizen (adds 0.50%)
 * @param {string} params.language - Language code
 * @param {number} params.maxResults - Max banks to return (default 5)
 * @returns {Array} Ranked list of banks with rates
 */
export function compareFDRates({ tenure, amount, isSenior = false, language = 'hi', maxResults = 5 }) {
  const lang = language;
  
  // Normalize tenure key
  const tenureKey = findTenureKey(tenure);
  if (!tenureKey) {
    return [];
  }

  const results = FD_RATES.map(bank => {
    let rate = bank.rates[tenureKey] || bank.rates['1y-2y'];
    let seniorExtra = 0;
    
    if (isSenior && bank.senior_rates) {
      if (typeof bank.senior_rates === 'object' && bank.senior_rates['+0.50%']) {
        seniorExtra = 0.50;
      } else if (bank.senior_rates[tenureKey]) {
        seniorExtra = bank.senior_rates[tenureKey] - rate;
      }
    }
    
    const finalRate = rate + seniorExtra;
    
    return {
      bank_id: bank.bank_id,
      bank_name: bank.bank_name[lang] || bank.bank_name.en,
      bank_short: bank.bank_short,
      logo: bank.logo || '🏦',
      type: bank.type,
      rate: finalRate,
      original_rate: rate,
      senior_extra: seniorExtra,
      tenure: tenureKey,
      tenure_label: TENURE_LABELS[tenureKey]?.hi || tenureKey,
      min_amount: bank.min_amount,
      special_schemes: bank.special_schemes || [],
      website: `${bank.bank_id}.co.in`,
      keywords: bank.keywords,
    };
  })
  .filter(b => b.rate > 0)
  .sort((a, b) => b.rate - a.rate)
  .slice(0, maxResults);

  return results;
}

/**
 * Detect tenure from natural language.
 */
export function detectTenure(text) {
  const t = text.toLowerCase();
  
  const tenureMap = {
    '1y': ['1 साल', '1 वर्ष', '1 year', 'one year', 'ek saal', 'saal भर', '1 saal', '1sal'],
    '2y': ['2 साल', '2 वर्ष', '2 years', 'two years', 'do saal', '2 saal', '2sal'],
    '3y': ['3 साल', '3 वर्ष', '3 years', 'teen saal', '3 saal', '3sal'],
    '5y': ['5 साल', '5 वर्ष', '5 years', 'paanch saal', '5 saal', '5sal'],
    '6m-9m': ['6 महीने', '9 महीने', '6 months', '9 months', 'chhah mahine', 'nau mahine'],
    '9m-1y': ['9 महीने', '12 महीने', '1 साल', 'saal', 'sal'],
    '1y-2y': ['1 से 2 साल', '1-2 साल', '1 to 2 years'],
    '3y-5y': ['3 से 5 साल', '3-5 साल', '3 to 5 years'],
    '91d-6m': ['3 महीने', '3 months', 'tin mahine'],
  };

  for (const [tenure, keywords] of Object.entries(tenureMap)) {
    if (keywords.some(k => t.includes(k))) {
      return tenure;
    }
  }
  
  // Default to 1 year if no specific tenure mentioned
  return '1y';
}

/**
 * Find closest matching tenure key.
 */
function findTenureKey(tenure) {
  const allTenures = Object.keys(TENURE_LABELS);
  
  // Direct match
  if (allTenures.includes(tenure)) return tenure;
  
  // Partial match
  for (const t of allTenures) {
    if (t.includes(tenure) || tenure.includes(t)) return t;
  }
  
  // Default to closest common tenure
  return '1y-2y';
}

/**
 * Calculate FD maturity amount.
 */
export function calculateFDReturn(principal, rate, tenureDays) {
  const years = tenureDays / 365;
  const maturity = principal * Math.pow(1 + rate / 100, years);
  const interest = maturity - principal;
  return {
    principal,
    rate,
    tenureDays,
    years: Math.round(years * 100) / 100,
    maturity: Math.round(maturity),
    interest: Math.round(interest),
  };
}

export default { compareFDRates, detectTenure, calculateFDReturn };

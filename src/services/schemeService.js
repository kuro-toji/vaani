/**
 * Scheme Finder Service
 * Searches and filters government schemes based on user profile and pincode region.
 */

import { SCHEMES, SCHEME_CATEGORIES } from '../data/schemes.js';
import { getRegionByPincode } from './pincodeService.js';

/**
 * Find schemes matching user query and profile.
 * 
 * @param {Object} params
 * @param {string} params.query - Free text search (e.g. "beti", "farmer loan")
 * @param {string} params.pincode - User's 6-digit pincode (optional)
 * @param {string} params.language - Language code (hi, en, etc.)
 * @param {string} params.category - Filter by category (optional)
 * @param {string} params.gender - 'male', 'female' (optional)
 * @param {number} params.age - User's age (optional)
 * @param {string} params.income - Annual income string like "3,00,000" (optional)
 * @param {string} params.occupation - e.g. 'farmer', 'student', 'trader', 'unemployed' (optional)
 * @param {number} params.maxResults - Max schemes to return (default 5)
 * @returns {Promise<Array>} Array of matching schemes
 */
export async function findSchemes({ query, pincode, language = 'hi', category, gender, age, income, occupation, maxResults = 5 }) {
  const lang = language;
  let results = [...SCHEMES];

  // Filter by category if provided
  if (category) {
    results = results.filter(s => s.category === category);
  }

  // Filter by keyword query
  if (query) {
    const q = query.toLowerCase().trim();
    results = results.filter(scheme => {
      const name = (scheme.name[lang] || scheme.name.en || '').toLowerCase();
      const desc = (scheme.description[lang] || scheme.description.en || '').toLowerCase();
      const keywords = (scheme.keywords || []).map(k => k.toLowerCase());
      return keywords.some(k => k.includes(q)) || name.includes(q) || desc.includes(q);
    });
  }

  // Filter by eligibility (simple rules)
  if (gender === 'female' || gender === 'woman' || gender === 'beti' || gender === 'maa') {
    results = results.filter(scheme => {
      if (!scheme.eligibility?.gender) return true;
      return scheme.eligibility.gender.includes('female_only') === false || 
             scheme.eligibility.gender.includes('female_only');
    });
  }

  if (age !== undefined) {
    results = results.filter(scheme => {
      if (!scheme.eligibility?.age) return true;
      const [min, max] = scheme.eligibility.age;
      return age >= min && age <= max;
    });
  }

  // Sort by keyword match relevance
  if (query) {
    results.sort((a, b) => {
      const aMatch = (a.keywords || []).some(k => query.toLowerCase().includes(k));
      const bMatch = (b.keywords || []).some(k => query.toLowerCase().includes(k));
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }

  // Trim to max results
  results = results.slice(0, maxResults);

  // Format results for voice/text output
  return results.map(scheme => ({
    id: scheme.id,
    name: scheme.name[lang] || scheme.name.en,
    description: scheme.description[lang] || scheme.description.en,
    benefit: scheme.benefit 
      ? `₹${scheme.benefit.toLocaleString('en-IN')} ${scheme.benefitUnitHi || ''}`
      : scheme.interestRateText 
        ? scheme.interestRateText[lang] || scheme.interestRateText.en
        : scheme.premium?.text?.[lang] || (scheme.premium ? `₹${scheme.premium.amount}/${scheme.premium.unit}` : null),
    category: scheme.category,
    ministry: scheme.ministry,
    website: scheme.website,
    documents: (scheme.documents || []).slice(0, 4),
    applicationMode: (scheme.applicationMode || []).slice(0, 2),
    eligibility: scheme.eligibility,
    categoryName: SCHEME_CATEGORIES.find(c => c.id === scheme.category)?.name?.[lang] || 
                  SCHEME_CATEGORIES.find(c => c.id === scheme.category)?.name?.en || scheme.category,
  }));
}

/**
 * Get schemes by conversation topic/detected intent.
 */
export async function detectSchemeIntent(userMessage, language = 'hi') {
  const text = userMessage.toLowerCase();
  
  // Intent keywords mapping
  const intentMap = {
    savings: ['बचत', 'save', 'निवेश', 'investment', 'पैसा जमा', 'deposit', 'fixed deposit', 'fd', 'rd'],
    loan: ['लोन', 'loan', 'ऋण', 'lend', 'कर्ज', 'borrow', 'credit', 'mudra', 'व्यापार लोन'],
    insurance: ['बीमा', 'insurance', 'जीवन', 'accident', 'suraksha', 'jeevan', 'pension yojana'],
    pension: ['पेंशन', 'pension', 'retirement', 'old age', 'buddhi jeevan'],
    education: ['शिक्षा', 'education', 'student', 'vidya', 'college', 'padhai', 'loan'],
    housing: ['घर', 'house', 'ghar', 'awas', 'home', 'rural housing'],
    skill: ['skill', 'training', 'job', 'naukri', 'kaushal', 'rozgar', 'employment'],
    income_support: ['kisan', 'farmer', 'crop', 'pmkisan', 'support', 'bijli', 'ujjwala'],
    banking: ['bank account', 'jana dhan', 'jan dhan', 'banking', 'खाता'],
  };

  for (const [intent, keywords] of Object.entries(intentMap)) {
    if (keywords.some(k => text.includes(k))) {
      return intent;
    }
  }
  return null;
}

export default { findSchemes, detectSchemeIntent };

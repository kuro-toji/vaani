/**
 * Profile Matcher Service
 * Takes a user profile and finds the best matching government schemes.
 * This is the core innovation: proactive scheme discovery, not reactive search.
 */

import { SCHEMES } from '../data/schemes.js';

/**
 * Build a user profile from available data.
 * 
 * @param {Object} params
 * @param {string} params.age - User's age (optional)
 * @param {string} params.gender - 'male', 'female', 'other'
 * @param {string} params.occupation - 'farmer', 'student', 'trader', 'worker', 'unemployed', 'retired'
 * @param {string} params.income - Annual income string like '3,00,000' (optional)
 * @param {string} params.state - State name (optional)
 * @param {string} params.hasBankAccount - boolean
 * @param {string} params.hasLand - boolean (for farmer schemes)
 * @param {string} params.language - Language code
 * @returns {Array} Top 3 matching schemes with match reasons
 */
export function matchSchemesToProfile({ age, gender, occupation, income, state, hasBankAccount, hasLand, language = 'hi' }) {
  const lang = language;
  const ageNum = parseInt(age) || null;
  const incomeNum = parseInt((income || '').replace(/[^\d]/g, '')) || null;
  const occ = (occupation || '').toLowerCase();
  const isFemale = ['female', 'woman', 'beti', 'maa', 'maa'].some(t => occ.includes(t));
  const isFarmer = ['farmer', 'kisan', 'खेत', ' agriculture'].some(t => occ.includes(t));
  const isStudent = ['student', 'vidyarthi', 'padhak', 'college'].some(t => occ.includes(t));
  const isTrader = ['trader', 'shopkeeper', 'dukan', 'व्यापार', 'vendor'].some(t => occ.includes(t));
  const isWorker = ['worker', 'majdoor', 'labour', 'mason', 'driver'].some(t => occ.includes(t));
  const isElderly = ageNum && ageNum >= 60;

  const scored = SCHEMES.map(scheme => {
    let score = 0;
    const reasons = [];

    // Gender scoring
    if (scheme.eligibility?.gender === 'female_only' && isFemale) {
      score += 30;
      reasons.push({ hi: '✓ बेटी के लिए', en: '✓ For daughter' });
    }
    if (scheme.eligibility?.gender !== 'female_only' && gender !== 'female') {
      score += 5;
    }

    // Age scoring
    if (ageNum && scheme.eligibility?.age) {
      const [minAge, maxAge] = scheme.eligibility.age;
      if (ageNum >= minAge && ageNum <= maxAge) {
        score += 25;
        reasons.push({ 
          hi: `✓ उम्र ${ageNum} सही`, 
          en: `✓ Age ${ageNum} fits` 
        });
      } else {
        score -= 50; // Hard disqualify
      }
    }

    // Occupation scoring
    if (isFarmer && scheme.id === 'pm_kisan') {
      score += 40;
      reasons.push({ hi: '✓ किसानों के लिए', en: '✓ For farmers' });
    }
    if (isStudent && (scheme.id === 'vida' || scheme.id === 'kaushal_vikas')) {
      score += 40;
      reasons.push({ hi: '✓ students के लिए', en: '✓ For students' });
    }
    if (isTrader && (scheme.id === 'mudra_loan' || scheme.id === 'stand_up_india')) {
      score += 40;
      reasons.push({ hi: '✓ traders के लिए', en: '✓ For traders' });
    }
    if (isWorker && scheme.id === 'atal_pension') {
      score += 35;
      reasons.push({ hi: '✓ workers के लिए', en: '✓ For workers' });
    }
    if (isFemale && scheme.id === 'sukanya_samriddhi') {
      score += 35;
      reasons.push({ hi: '✓ बेटी के लिए best', en: '✓ Best for daughter' });
    }
    if (isElderly && scheme.id === 'atal_pension') {
      score += 30;
      reasons.push({ hi: '✓ बुज़ुर्गों के लिए', en: '✓ For elderly' });
    }

    // Income scoring
    if (incomeNum && scheme.eligibility?.income?.max) {
      if (incomeNum <= scheme.eligibility.income.max) {
        score += 15;
        reasons.push({ hi: '✓ income सही', en: '✓ Income eligible' });
      } else {
        score -= 30;
      }
    }

    // Banking requirement
    if (!hasBankAccount && (scheme.id === 'jan_dhan' || scheme.id === 'pmjjby' || scheme.id === 'pmsby')) {
      score += 20; // These CREATE bank accounts
    }

    return {
      ...scheme,
      matchScore: score,
      matchReasons: reasons,
    };
  });

  // Filter out negative scores (disqualified) and sort
  const matches = scored
    .filter(s => s.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)
    .map(s => ({
      id: s.id,
      name: s.name[lang] || s.name.en,
      description: s.description[lang] || s.description.en,
      benefit: s.benefit 
        ? `₹${s.benefit.toLocaleString('en-IN')} ${s.benefitUnitHi || ''}`
        : s.interestRateText?.[lang]
        || s.premium?.text?.[lang]
        || null,
      categoryName: s.categoryName,
      matchScore: s.matchScore,
      matchReasons: s.matchReasons.map(r => r[lang] || r.en),
      website: s.website,
      documents: (s.documents || []).slice(0, 3),
      howToApply: (s.applicationMode || []).slice(0, 1)[0] || 'Nearest bank or CSC',
    }));

  return matches;
}

/**
 * Detect user profile from natural language description.
 */
export function detectProfileFromText(text) {
  const lower = text.toLowerCase();
  const profile = {};

  // Age detection
  const ageMatch = lower.match(/(\d+)[\s]*(year|saal|vee|वर्ष|साल|umr)/i);
  if (ageMatch) profile.age = ageMatch[1];

  // Gender detection
  if (/\b(female|woman|beti|maa|ladki|she|her)\b/i.test(text)) profile.gender = 'female';
  else if (/\b(male|man|ladka|he|his)\b/i.test(text)) profile.gender = 'male';

  // Occupation detection
  if (/\b(kisan|farmer|खेत|khet)\b/i.test(text)) profile.occupation = 'farmer';
  else if (/\b(student|vidyarthi|college|school|padhak)\b/i.test(text)) profile.occupation = 'student';
  else if (/\b(trader|shopkeeper|dukan|vyapar|business)\b/i.test(text)) profile.occupation = 'trader';
  else if (/\b(worker|majdoor|labour|naukri|job|employee)\b/i.test(text)) profile.occupation = 'worker';
  else if (/\b(retired|retiree|buddha)\b/i.test(text)) profile.occupation = 'retired';

  // Income detection
  const incomeMatch = text.match(/₹?\s*(\d+[\d,]*)\s*(rupee|lakh|लाख|income|kharcha)/i);
  if (incomeMatch) profile.income = incomeMatch[1];

  return profile;
}

export default { matchSchemesToProfile, detectProfileFromText };

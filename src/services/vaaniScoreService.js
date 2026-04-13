/**
 * VAANI Score Service — Financial Health Score Calculator
 *
 * Analyzes conversation history to compute a 0-100 financial health score.
 * 5 pillars, 20 points each:
 *   1. Emergency Fund
 *   2. Insurance Coverage
 *   3. Active Investments (SIP/MF/FD)
 *   4. Savings Rate
 *   5. Debt Health
 */

const PILLARS = {
  EMERGENCY: { weight: 20, keywords: ['emergency fund', 'आपातकालीन', 'liquid fund', 'backup', 'rainy day', 'बचत'] },
  INSURANCE: { weight: 20, keywords: ['insurance', 'बीमा', 'term plan', 'health cover', 'mediclaim', 'स्वास्थ्य बीमा', 'जीवन बीमा'] },
  INVESTMENTS: { weight: 20, keywords: ['sip', 'mutual fund', 'fd', 'ppf', 'nps', 'gold bond', 'निवेश', 'म्यूचुअल फंड', 'एफडी', 'गोल्ड'] },
  SAVINGS: { weight: 20, keywords: ['save', 'बचत', 'saving', 'savings rate', 'bachao', 'bachat', 'बचाना'] },
  DEBT: { weight: 20, keywords: ['loan free', 'no emi', 'debt free', 'कर्ज मुक्त', 'paid off', 'no loan'] },
};

const NEGATIVE_KEYWORDS = {
  HIGH_DEBT: { penalty: -15, keywords: ['too much loan', 'bahut karza', 'बहुत कर्ज', 'emi problem', 'cant pay', 'default'] },
  NO_SAVINGS: { penalty: -10, keywords: ['no savings', 'कोई बचत नहीं', 'nothing saved', 'zero savings'] },
  NO_INSURANCE: { penalty: -10, keywords: ['no insurance', 'कोई बीमा नहीं', 'not insured'] },
};

/**
 * Calculate VAANI Score from conversation messages.
 * @param {Object} userProfile - User profile object
 * @param {Array} messages - Array of { role, content } message objects
 * @returns {Object} { score, breakdown, level, emoji, advice }
 */
export function calculateVaaniScore(userProfile, messages = []) {
  // Ensure messages is always an array
  const messageArray = Array.isArray(messages) ? messages : [];
  
  if (messageArray.length === 0) {
    return {
      score: 0,
      breakdown: {},
      level: 'unknown',
      emoji: '❓',
      advice: 'अपनी वित्तीय स्थिति बताएं ताकि हम आपका VAANI Score बना सकें।'
    };
  }

  const allText = messageArray.map(m => m.content.toLowerCase()).join(' ');

  let totalScore = 0;
  const breakdown = {};

  for (const [pillar, config] of Object.entries(PILLARS)) {
    const hasEvidence = config.keywords.some(kw => allText.includes(kw));
    const userMentioned = messageArray
      .filter(m => m.role === 'user')
      .some(m => config.keywords.some(kw => m.content.toLowerCase().includes(kw)));
    const aiConfirmed = messageArray
      .filter(m => m.role === 'assistant')
      .some(m => config.keywords.some(kw => m.content.toLowerCase().includes(kw)));

    let pillarScore = 0;
    if (userMentioned && aiConfirmed) {
      pillarScore = config.weight;
    } else if (hasEvidence) {
      pillarScore = Math.round(config.weight * 0.6);
    }

    breakdown[pillar] = pillarScore;
    totalScore += pillarScore;
  }

  for (const [, config] of Object.entries(NEGATIVE_KEYWORDS)) {
    if (config.keywords.some(kw => allText.includes(kw))) {
      totalScore = Math.max(0, totalScore + config.penalty);
    }
  }

  const score = Math.min(100, Math.max(0, totalScore));

  let level, emoji, advice;
  if (score >= 80) {
    level = 'excellent'; emoji = '🟢';
    advice = 'बहुत बढ़िया! आपकी वित्तीय स्थिति मजबूत है।';
  } else if (score >= 60) {
    level = 'good'; emoji = '🟡';
    advice = 'अच्छा है! कुछ और सुधार से आप और मजबूत हो सकते हैं।';
  } else if (score >= 40) {
    level = 'fair'; emoji = '🟠';
    advice = 'ठीक है, लेकिन बीमा और आपातकालीन फंड पर ध्यान दें।';
  } else if (score > 0) {
    level = 'needs-work'; emoji = '🔴';
    advice = 'अभी शुरू करें — छोटी बचत से बड़ा फर्क पड़ता है!';
  } else {
    level = 'unknown'; emoji = '❓';
    advice = 'अपनी वित्तीय स्थिति बताएं ताकि हम आपका VAANI Score बना सकें।';
  }

  return { score, breakdown, level, emoji, advice };
}

export default { calculateVaaniScore };
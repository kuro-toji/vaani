/**
 * Micro-Nudge Savings Service
 * 
 * Identifies small idle amounts (₹20-₹100) that could be saved
 * and generates friendly voice nudges to encourage saving.
 */

import { languages } from '../data/languages.js';

export function generateMicroNudge(idleBalance, context = {}) {
  const {
    dayOfWeek = 'monday',
    lastSavingsDate = null,
    userName = '',
    preferredLanguage = 'Hindi'
  } = context;

  // Templates for different scenarios
  const nudgeTemplates = {
    Hindi: {
      weekend: [
        'Aaj Chhutti hai, ₹{amount} extra bacha. Galla mein daal dein?',
        'Weekend hai, Shopping ke bajaye ₹{amount} invest karo!',
        'Aaj ₹{amount} extra hai aapke pass, Nammesteen mein secure kardo!'
      ],
      weekday: [
        'Subah ki chai ki bachat ₹{amount}! Save karo?',
        '₹{amount} aaj aapke account mein same the. Invest karo!',
        'Chai-COffee bachat: ₹{amount}! Kal ke liye lock karo?'
      ],
      afterPayday: [
        'Salary aaya! ₹{amount} immediately invest karo, kharcha hone se pehle!',
        'Mahine ki shuruat, sabse pehle ₹{amount} secure karo!',
        'Salary aane ke 3 din mein 10% bachana Mushkil hota hai - Abhi karo!'
      ],
      generic: [
        '₹{amount} aaj bacha, Kal ka guarantee nahi!',
        'Chhota rakam hai par习惯了 hone se bada ho jata hai।',
        '₹{amount} = 1 SIP installment! Start karo aaj!'
      ]
    },
    Tamil: {
      generic: [
        '₹{amount} இன்று மிச்சம், 내일 гарантия இல்லை!',
        'சிறிய தொகை, பெரிய எதிர்காலம்! ₹{amount} сбережения!',
        '₹{amount} = 1 SIP! Shuru karo!'
      ]
    }
  };

  const templates = nudgeTemplates[preferredLanguage] || nudgeTemplates['Hindi'];
  
  // Determine context
  let templateSet;
  const today = new Date().getDay();
  const isWeekend = today === 0 || today === 6;
  const dayOfMonth = new Date().getDate();
  const isNearPayday = dayOfMonth <= 5;

  if (isNearPayday) {
    templateSet = templates.afterPayday || templates.generic;
  } else if (isWeekend) {
    templateSet = templates.weekend || templates.generic;
  } else {
    templateSet = templates.weekday || templates.generic;
  }

  // Pick random template
  const template = templateSet[Math.floor(Math.random() * templateSet.length)];
  
  // Format with amount
  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(idleBalance);

  return {
    text: template.replace('{amount}', formattedAmount),
    amount: idleBalance,
    formattedAmount: formattedAmount,
    language: preferredLanguage,
    priority: idleBalance > 100 ? 'high' : 'medium'
  };
}

export function calculateSavingsPotential(monthlyIncome, currentSavings) {
  // Ideal: 20% savings rate
  const idealMonthlySavings = monthlyIncome * 0.2;
  const currentSavingsRate = monthlyIncome > 0 ? (currentSavings / monthlyIncome) * 100 : 0;
  const gap = idealMonthlySavings - currentSavings;
  
  return {
    currentSavingsRate: Math.round(currentSavingsRate),
    idealSavingsRate: 20,
    monthlyGap: Math.max(0, Math.round(gap)),
    suggestion: gap > 0 
      ? `₹${Math.round(gap)}/month बचत बढ़ाएं`
      : 'बहुत बढ़िया! आपकी बचत दर अच्छी है',
    microSavingsTip: generateMicroSavingsTip(gap)
  };
}

function generateMicroSavingsTip(gap) {
  if (gap <= 0) return null;
  
  const tips = [
    '₹20/day चाय बंद = ₹600/month बचत!',
    '₹50/day ऑटो बचत = ₹1500/month!',
    'डमी SIP शुरू करो - ₹500/month से!',
    'UPI बचत ऐप लिंक करो - अकाउंट में ज्यादा तोबा हटाओ!',
    'GoodBye बिजी खरीदारी, Hello बचत!'
  ];
  
  return tips[Math.floor(Math.random() * tips.length)];
}

export function detectIdleBalance(transactions) {
  // Analyze transactions to find idle balance
  // This would connect to actual bank API in production
  // For now, simulate detection
  
  if (!transactions || transactions.length === 0) {
    return {
      hasIdleBalance: false,
      idleAmount: 0,
      daysIdle: 0,
      suggestion: null
    };
  }

  // Sort by date descending
  const sorted = [...transactions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const latest = sorted[0];
  const daysSinceTransaction = Math.floor(
    (Date.now() - new Date(latest.date)) / (1000 * 60 * 60 * 24)
  );

  // If balance hasn't changed in 7+ days, consider it idle
  if (daysSinceTransaction >= 7 && latest.balance > 500) {
    return {
      hasIdleBalance: true,
      idleAmount: latest.balance,
      daysIdle: daysSinceTransaction,
      suggestion: `₹${latest.balance} ${daysSinceTransaction} दिन से खाते में है - कुछ invest करो?`
    };
  }

  return {
    hasIdleBalance: false,
    idleAmount: 0,
    daysIdle: 0,
    suggestion: null
  };
}
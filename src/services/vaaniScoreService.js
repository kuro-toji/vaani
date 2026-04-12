/**
 * VAANI Score - Life Goal Alignment Metric
 * 
 * Unlike traditional finance metrics that track market returns,
 * VAANI Score measures how well your money supports your LIFE GOALS.
 * 
 * Score Range: 0-100
 * - 80-100: Excellent - On track for life goals
 * - 60-79: Good - Making progress
 * - 40-59: Needs Attention - Gaps in financial planning
 * - 0-39: Take Action - Significant gaps
 */

import { dialectMetaphors } from '../data/dialectMetaphors.js';

export function calculateVaaniScore(userProfile, messages) {
  const {
    monthlyIncome = 0,
    savingsRatio = 0, // % of income saved
    hasEmergencyFund = false,
    hasInsurance = false,
    hasInvestment = false,
    lifeGoals = [],
    dependents = 0
  } = userProfile;

  let score = 50; // Start at middle
  let factors = [];

  // 1. Savings Ratio (ideal: 20%+)
  if (savingsRatio >= 20) {
    score += 15;
    factors.push({ factor: 'savings', impact: '+15', reason: 'Excellent savings rate' });
  } else if (savingsRatio >= 10) {
    score += 8;
    factors.push({ factor: 'savings', impact: '+8', reason: 'Good savings rate' });
  } else if (savingsRatio > 0) {
    score += 3;
    factors.push({ factor: 'savings', impact: '+3', reason: 'Some savings' });
  } else {
    score -= 10;
    factors.push({ factor: 'savings', impact: '-10', reason: 'No savings' });
  }

  // 2. Emergency Fund (ideal: 6 months expenses)
  if (hasEmergencyFund) {
    score += 15;
    factors.push({ factor: 'emergency', impact: '+15', reason: 'Emergency fund ready' });
  } else {
    score -= 5;
    factors.push({ factor: 'emergency', impact: '-5', reason: 'Need emergency fund' });
  }

  // 3. Insurance Coverage
  if (hasInsurance) {
    score += 15;
    factors.push({ factor: 'insurance', impact: '+15', reason: 'Insurance coverage active' });
  } else {
    score -= 10;
    factors.push({ factor: 'insurance', impact: '-10', reason: 'Need insurance' });
  }

  // 4. Investment Diversity
  if (hasInvestment) {
    score += 10;
    factors.push({ factor: 'investment', impact: '+10', reason: 'Investing for future' });
  } else {
    score -= 5;
    factors.push({ factor: 'investment', impact: '-5', reason: 'Not investing yet' });
  }

  // 5. Life Goals Alignment (from conversation)
  const goalAlignment = analyzeLifeGoalsFromChat(messages);
  score += goalAlignment.score;
  factors.push(...goalAlignment.factors);

  // 6. Dependents adjustment
  if (dependents > 2) {
    score -= 5;
    factors.push({ factor: 'dependents', impact: '-5', reason: `${dependents} dependents - need more coverage` });
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    grade: getGrade(score),
    status: getStatus(score),
    color: getColor(score),
    factors,
    recommendation: getRecommendation(score, factors)
  };
}

function analyzeLifeGoalsFromChat(messages) {
  let score = 0;
  const factors = [];
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Marriage planning
  if (userText.includes('shadi') || userText.includes('shaadi') || userText.includes('शादी')) {
    score += 5;
    factors.push({ factor: 'lifeGoal', impact: '+5', reason: 'Planning for marriage' });
  }

  // Education planning
  if (userText.includes('padhai') || userText.includes('education') || userText.includes('पढ़ाई')) {
    score += 5;
    factors.push({ factor: 'lifeGoal', impact: '+5', reason: 'Planning for education' });
  }

  // Retirement planning
  if (userText.includes('retirement') || userText.includes('pens') || userText.includes('रिटायर')) {
    score += 5;
    factors.push({ factor: 'lifeGoal', impact: '+5', reason: 'Planning retirement' });
  }

  // Home buying
  if (userText.includes('ghar') || userText.includes('home') || userText.includes('घर')) {
    score += 3;
    factors.push({ factor: 'lifeGoal', impact: '+3', reason: 'Planning home purchase' });
  }

  return { score, factors };
}

function getGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

function getStatus(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'attention';
  return 'action';
}

function getColor(score) {
  if (score >= 80) return '#10B981'; // green
  if (score >= 60) return '#22C55E'; // light green
  if (score >= 40) return '#F59E0B'; // yellow
  return '#EF4444'; // red
}

function getRecommendation(score, factors) {
  if (score >= 80) {
    return 'बहुत बढ़िया! आप अपने लक्ष्यों की राह पर हैं।';
  }
  if (score >= 60) {
    return 'अच्छा है, लेकिन और बेहतर हो सकता है।';
  }
  if (score >= 40) {
    return 'ध्यान दें - कुछ जरूरी कदम उठाने की जरूरत है।';
  }
  return 'अभी कार्य करें - आपातकालीन निधि और बीमा सबसे जरूरी है।';
}

export function formatVaaniScore(scoreData, language = 'Hindi') {
  const { score, grade, status, color, factors, recommendation } = scoreData;
  
  return {
    display: `VAANI Score: ${score}/100`,
    grade: `Grade: ${grade}`,
    status: status,
    color: color,
    factors: factors,
    recommendation: recommendation,
    language: language
  };
}
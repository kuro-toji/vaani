// ═══════════════════════════════════════════════════════════════════
// VAANI Recommendation Engine — Web Version
// Multi-factor weighted scoring for FD/SIP recommendations
// ═══════════════════════════════════════════════════════════════════

// ─── Scoring Weights ────────────────────────────────────────────
const WEIGHTS = {
  goalFit: 0.35,
  liquidity: 0.25,
  returnPotential: 0.20,
  riskAlignment: 0.10,
  tenureFit: 0.10,
};

// ─── User Profile (no type annotation for JS) ───────────────────
// profile: { age, incomeRange, investmentGoal, timeHorizon, liquidityNeed, riskAppetite, taxBracket?, isSenior }

// ─── Scored Product ─────────────────────────────────────────────
// scored: { id, name, type, score, confidence, signals, rationale, tradeoffs, details }

// ─── Goal Category Mapping ──────────────────────────────────────
const GOAL_TENURE_MAP = {
  emergency: { min: 7, max: 365, ideal: 'short' },
  shortTerm: { min: 90, max: 730, ideal: 'short' },
  wealthBuild: { min: 365, max: 1825, ideal: 'long' },
  retirement: { min: 1825, max: 3650, ideal: 'long' },
  childEducation: { min: 1095, max: 3650, ideal: 'long' },
};

// ─── FD Rates Data ──────────────────────────────────────────────
const FD_RATES_DATA = [
  { bank: 'SBI', id: 'sbi', tenures: { '1y': 5.10, '2y': 5.10, '3y': 5.10, '5y': 5.10 } },
  { bank: 'HDFC Bank', id: 'hdfc', tenures: { '1y': 5.15, '2y': 5.15, '3y': 5.30, '5y': 5.40 } },
  { bank: 'ICICI Bank', id: 'icici', tenures: { '1y': 5.15, '2y': 5.15, '3y': 5.25, '5y': 5.35 } },
  { bank: 'Axis Bank', id: 'axis', tenures: { '1y': 5.10, '2y': 5.20, '3y': 5.25, '5y': 5.30 } },
  { bank: 'Kotak Bank', id: 'kotak', tenures: { '1y': 5.10, '2y': 5.20, '3y': 5.25, '5y': 5.30 } },
  { bank: 'Yes Bank', id: 'yes', tenures: { '1y': 5.50, '2y': 5.50, '3y': 5.50, '5y': 5.50 } },
  { bank: 'IDFC First', id: 'idfc', tenures: { '1y': 5.50, '2y': 5.50, '3y': 5.50, '5y': 5.50 } },
];

// ─── Tenure Days Mapping ─────────────────────────────────────────
const TENURE_DAYS = { '1y': 365, '2y': 730, '3y': 1095, '5y': 1825 };

// ─── Score FD Product ────────────────────────────────────────────
function scoreFD(bank, tenure, profile) {
  const tenureDays = TENURE_DAYS[tenure] || 365;
  const goalConfig = GOAL_TENURE_MAP[profile.investmentGoal];
  const baseRate = profile.isSenior ? bank.tenures[tenure] + 0.5 : bank.tenures[tenure];

  // Goal fit
  const goalFitScore = tenureDays >= goalConfig.min && tenureDays <= goalConfig.max ? 1.0
    : tenureDays >= goalConfig.min * 0.5 && tenureDays <= goalConfig.max * 1.5 ? 0.6 : 0.2;

  // Liquidity
  const liquidityScore = tenureDays <= 90 ? 1.0 : tenureDays <= 365 ? 0.8 : tenureDays <= 730 ? 0.5 : 0.2;

  // Return potential
  const returnScore = Math.min(baseRate / 8.0, 1.0);

  // Risk alignment (FD is always low risk)
  const riskScore = profile.riskAppetite === 'low' ? 1.0 : profile.riskAppetite === 'moderate' ? 0.6 : 0.3;

  // Tenure fit
  const horizonMap = { short: 365, medium: 1095, long: 1825 };
  const tenureDiff = Math.abs(tenureDays - horizonMap[profile.timeHorizon]);
  const tenureScore = tenureDiff <= 90 ? 1.0 : tenureDiff <= 365 ? 0.6 : 0.2;

  const score = (
    goalFitScore * WEIGHTS.goalFit +
    liquidityScore * WEIGHTS.liquidity +
    returnScore * WEIGHTS.returnPotential +
    riskScore * WEIGHTS.riskAlignment +
    tenureScore * WEIGHTS.tenureFit
  );

  const gains = [];
  const sacrifices = [];

  if (liquidityScore > 0.7) gains.push('High liquidity - withdraw anytime');
  if (returnScore > 0.7) gains.push(`Competitive ${baseRate}% interest rate`);
  if (riskScore > 0.7) gains.push('Guaranteed returns, zero market risk');
  if (profile.taxBracket === '30%') gains.push('80C tax saving benefit');
  if (profile.isSenior) gains.push(`${(baseRate - bank.tenures[tenure]).toFixed(2)}% extra senior rate`);

  if (liquidityScore < 0.5) sacrifices.push('Locked until maturity');
  if (profile.investmentGoal === 'wealthBuild') sacrifices.push('FD may not beat inflation long-term');

  return {
    id: `${bank.id}_${tenure}`,
    name: `${bank.bank} ${tenure}`,
    type: 'fd',
    score: Math.round(score * 100) / 100,
    confidence: 'high',
    signals: { goalFit: goalFitScore, liquidity: liquidityScore, returnPotential: returnScore, riskAlignment: riskScore, tenureFit: tenureScore },
    rationale: `${bank.bank} ${tenure} FD at ${baseRate}%${profile.isSenior ? ' (senior rate)' : ''} - ideal for ${profile.investmentGoal.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
    tradeoffs: { gains, sacrifices },
    details: { bank: bank.bank, rate: baseRate, tenure, tenureDays },
  };
}

// ─── Get FD Recommendations ──────────────────────────────────────
export function getFDRecommendations(profile, options = {}) {
  const limit = options.limit || 5;
  const scored = [];

  for (const bank of FD_RATES_DATA) {
    for (const tenure of Object.keys(bank.tenures)) {
      scored.push(scoreFD(bank, tenure, profile));
    }
  }

  // Sort by score, then by rate for tie-breaker
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.details?.rate || 0) - (a.details?.rate || 0);
  });

  const recommendations = scored.slice(0, limit);

  const insights = [];
  if (profile.investmentGoal === 'emergency') insights.push('For emergency funds, prioritize liquidity. Consider short-term FDs or liquid funds.');
  if (profile.investmentGoal === 'wealthBuild') insights.push('Longer tenure FDs lock in current rates before potential cuts.');
  if (profile.isSenior) insights.push(`Senior citizens get ~0.5% extra rate across all banks.`);
  if (profile.taxBracket === '30%') insights.push('Tax-saving FDs under 80C reduce taxable income by up to ₹1.5L/year.');

  return {
    productType: 'fd',
    recommendations,
    insights,
  };
}

// ─── Get SIP Recommendations ─────────────────────────────────────
const MUTUAL_FUNDS_DATA = [
  { name: 'HDFC Top 100 Fund', category: 'large-cap', risk: 7 },
  { name: 'ICICI Prudential Bluechip Fund', category: 'large-cap', risk: 7 },
  { name: 'SBI Bluechip Fund', category: 'large-cap', risk: 7 },
  { name: 'Mirae Asset Large Cap Fund', category: 'large-cap', risk: 7 },
  { name: 'Axis Bluechip Fund', category: 'large-cap', risk: 7 },
  { name: 'UTI Nifty Index Fund', category: 'index', risk: 6 },
  { name: 'HDFC Index Fund Nifty 50', category: 'index', risk: 6 },
  { name: 'SBI Nifty Index Fund', category: 'index', risk: 6 },
  { name: 'Kotak Equity Opportunities Fund', category: 'mid-cap', risk: 8 },
  { name: 'PGIM India Midcap Fund', category: 'mid-cap', risk: 8 },
  { name: 'HDFC Short Term Debt Fund', category: 'debt', risk: 3 },
  { name: 'ICICI Prudential Short Term Fund', category: 'debt', risk: 3 },
  { name: 'SBI Liquid Fund', category: 'liquid', risk: 2 },
  { name: 'HDFC Liquid Fund', category: 'liquid', risk: 2 },
];

function scoreSIP(fund, profile) {
  const goalConfig = GOAL_TENURE_MAP[profile.investmentGoal];
  const isEquity = fund.category === 'large-cap' || fund.category === 'mid-cap' || fund.category === 'index';
  const isDebt = fund.category === 'debt' || fund.category === 'liquid';

  // Goal fit
  const goalFitScore = (profile.investmentGoal === 'wealthBuild' || profile.investmentGoal === 'retirement')
    ? (isEquity ? 1.0 : isDebt ? 0.3 : 0.5)
    : profile.investmentGoal === 'childEducation' ? (isEquity ? 0.8 : 0.4)
    : 0.3;

  // Liquidity
  const liquidityScore = profile.liquidityNeed === 'high' ? 1.0 : profile.liquidityNeed === 'medium' ? 0.7 : 0.4;

  // Return potential
  const returnScore = fund.risk / 10;

  // Risk alignment
  const riskScore = Math.abs(fund.risk / 10 - (profile.riskAppetite === 'low' ? 0.2 : profile.riskAppetite === 'moderate' ? 0.5 : 0.8));

  // Tenure fit
  const tenureScore = profile.timeHorizon === 'long' ? (isEquity ? 1.0 : 0.4)
    : profile.timeHorizon === 'medium' ? (isDebt ? 0.8 : 0.4) : 0.2;

  const score = (
    goalFitScore * WEIGHTS.goalFit +
    liquidityScore * WEIGHTS.liquidity +
    returnScore * WEIGHTS.returnPotential +
    riskScore * WEIGHTS.riskAlignment +
    tenureScore * WEIGHTS.tenureFit
  );

  const gains = [];
  const sacrifices = [];

  if (isEquity && profile.timeHorizon === 'long') gains.push('Equity growth potential over long term');
  if (isDebt) gains.push('Stable returns with lower volatility');
  if (profile.taxBracket === '30%') gains.push('Long-term capital gains benefit');
  gains.push('SIP allows starting with ₹500/month');
  gains.push('Professional fund management');

  if (isEquity && profile.liquidityNeed === 'high') sacrifices.push('Equity can be volatile short-term');
  if (isDebt && profile.investmentGoal === 'wealthBuild') sacrifices.push('May not beat inflation long-term');
  sacrifices.push('Market-linked, not guaranteed returns');
  sacrifices.push('Exit load if withdrawn early');

  return {
    id: `sip_${fund.name.replace(/\s+/g, '_')}`,
    name: fund.name,
    type: 'sip',
    score: Math.round(score * 100) / 100,
    confidence: 'high',
    signals: { goalFit: goalFitScore, liquidity: liquidityScore, returnPotential: returnScore, riskAlignment: riskScore, tenureFit: tenureScore },
    rationale: `${fund.name} (${fund.category}) - ${isEquity ? 'Higher risk, higher potential returns' : 'Stable, predictable returns'}`,
    tradeoffs: { gains, sacrifices },
    details: { category: fund.category, risk: fund.risk },
  };
}

export function getSIPRecommendations(profile, options = {}) {
  const limit = options.limit || 5;
  let funds = MUTUAL_FUNDS_DATA;

  // Filter by category
  if (options.category) {
    const cat = options.category.toLowerCase();
    funds = funds.filter(f => f.category.includes(cat));
  }

  const scored = funds.map(f => scoreSIP(f, profile));
  scored.sort((a, b) => b.score - a.score);

  const recommendations = scored.slice(0, limit);

  const insights = [];
  if (profile.timeHorizon === 'long' && profile.riskAppetite !== 'low') {
    insights.push('Long horizon + moderate risk = equity SIP can compound significantly over 10+ years.');
  }
  if (profile.investmentGoal === 'retirement') {
    insights.push('Index funds like UTI Nifty 50 offer market returns with low fees for long-term retirement planning.');
  }
  if (profile.incomeRange === 'high') {
    insights.push('Consider SIPs in large-cap + mid-cap + international funds for diversification.');
  }
  insights.push(`SIP can start from just ₹500/month - consistency beats timing.`);

  return {
    productType: 'sip',
    recommendations,
    insights,
  };
}

// ─── Get Combined Recommendation ────────────────────────────────
export function getRecommendation(type, profile, options) {
  if (type === 'fd') return getFDRecommendations(profile, options);
  if (type === 'sip') return getSIPRecommendations(profile, options);
  return { fd: getFDRecommendations(profile, options), sip: getSIPRecommendations(profile, options) };
}

// ─── Format for Voice Output ─────────────────────────────────────
export function formatForVoice(result) {
  if (!result.recommendations?.length) return 'No recommendations found.';

  const top = result.recommendations[0];
  const label = result.productType === 'fd' ? 'FD' : 'SIP';

  let output = `Top ${label}: ${top.name}. Score ${Math.round(top.score * 100)}%. ${top.rationale}`;
  if (top.tradeoffs.gains.length) output += ` Benefits: ${top.tradeoffs.gains.slice(0, 2).join('. ')}`;
  if (result.insights?.[0]) output += ` ${result.insights[0]}`;

  return output;
}

export default { getFDRecommendations, getSIPRecommendations, getRecommendation, formatForVoice };
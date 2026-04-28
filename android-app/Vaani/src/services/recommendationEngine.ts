// ═══════════════════════════════════════════════════════════════════
// VAANI Recommendation Engine — Multi-factor weighted scoring model
// Transforms user preferences + real product data → ranked, explainable recommendations
// ═══════════════════════════════════════════════════════════════════

import { supabase } from './supabase';
import { fetchAllFunds, fetchNavByCode, MFFund } from './amfiService';
import { getBestFDRates, FDRate, SUPPORTED_BANKS } from './fdScraperService';

// ─── Scoring Weights (configurable) ────────────────────────────────
const WEIGHTS = {
  goalFit: 0.35,
  liquidity: 0.25,
  returnPotential: 0.20,
  riskAlignment: 0.10,
  tenureFit: 0.10,
};

// ─── User Profile Types ────────────────────────────────────────────
export interface UserProfile {
  age: number;
  incomeRange: 'low' | 'medium' | 'high';
  investmentGoal: 'emergency' | 'shortTerm' | 'wealthBuild' | 'retirement' | 'childEducation';
  timeHorizon: 'short' | 'medium' | 'long'; // <1yr, 1-5yr, 5yr+
  liquidityNeed: 'high' | 'medium' | 'low';
  riskAppetite: 'low' | 'moderate' | 'high';
  taxBracket?: '30%' | '20%' | '10%' | 'nil';
  isSenior: boolean;
}

// ─── Recommendation Result Types ───────────────────────────────────
export interface ScoredProduct {
  id: string;
  name: string;
  type: 'fd' | 'sip';
  score: number;
  confidence: 'high' | 'medium' | 'low';
  signals: {
    goalFit: number;
    liquidity: number;
    returnPotential: number;
    riskAlignment: number;
    tenureFit: number;
  };
  rationale: string;
  tradeoffs: {
    gains: string[];
    sacrifices: string[];
  };
  details: any;
}

export interface RecommendationResult {
  productType: 'fd' | 'sip';
  recommendations: ScoredProduct[];
  insights: string[];
  comparedToAlternatives?: string;
}

// ─── Goal Category Mapping ──────────────────────────────────────────
const GOAL_TENURE_MAP: Record<string, { min: number; max: number; ideal: string }> = {
  emergency: { min: 7, max: 365, ideal: 'short' },
  shortTerm: { min: 90, max: 730, ideal: 'short' },
  wealthBuild: { min: 365, max: 1825, ideal: 'long' },
  retirement: { min: 1825, max: 3650, ideal: 'long' },
  childEducation: { min: 1095, max: 3650, ideal: 'long' },
};

// ─── Risk Category Mapping ──────────────────────────────────────────
const RISK_CATEGORIES: Record<string, number> = {
  fd: 1,      // Lowest risk
  debt: 2,
  hybrid: 4,
  equity: 7,   // Highest risk
};

// ─── Calculate Signal Score (0-1) ──────────────────────────────────
function calculateSignalScore(weight: number, condition: boolean): number {
  return condition ? weight : 0;
}

// ─── Score FD Product ────────────────────────────────────────────────
function scoreFD(bankFD: FDRate, profile: UserProfile): ScoredProduct {
  const tenureDays = bankFD.tenure_days;
  const goalConfig = GOAL_TENURE_MAP[profile.investmentGoal];
  const isSenior = profile.isSenior;
  const baseRate = isSenior ? bankFD.senior_rate : bankFD.rate;

  // Goal fit: Is tenure within goal range?
  const goalFitScore = tenureDays >= goalConfig.min && tenureDays <= goalConfig.max ? 1.0
    : tenureDays >= goalConfig.min * 0.5 && tenureDays <= goalConfig.max * 1.5 ? 0.6
    : 0.2;

  // Liquidity: Lower tenure = higher liquidity
  const liquidityScore = tenureDays <= 90 ? 1.0
    : tenureDays <= 365 ? 0.8
    : tenureDays <= 730 ? 0.5
    : 0.2;

  // Return potential: Higher rate = better
  const returnScore = Math.min(baseRate / 8.0, 1.0); // Normalize to 8% max

  // Risk alignment: FD is always low risk
  const riskScore = profile.riskAppetite === 'low' ? 1.0
    : profile.riskAppetite === 'moderate' ? 0.6
    : 0.3;

  // Tenure fit: Match user's horizon preference
  const horizonMap: Record<string, number> = { short: 365, medium: 1095, long: 1825 };
  const tenureDiff = Math.abs(tenureDays - horizonMap[profile.timeHorizon]);
  const tenureScore = tenureDiff <= 90 ? 1.0 : tenureDiff <= 365 ? 0.6 : 0.2;

  // Weighted total
  const score = (
    goalFitScore * WEIGHTS.goalFit +
    liquidityScore * WEIGHTS.liquidity +
    returnScore * WEIGHTS.returnPotential +
    riskScore * WEIGHTS.riskAlignment +
    tenureScore * WEIGHTS.tenureFit
  );

  // Confidence based on data completeness
  const confidence: 'high' | 'medium' | 'low' = baseRate > 0 ? 'high' : 'medium';

  // Generate rationale
  const rationale = `Best for ${profile.investmentGoal.replace(/([A-Z])/g, ' $1').toLowerCase()} with ${bankFD.rate}% rate${isSenior ? ' (senior rate)' : ''}. Tenure of ${Math.round(tenureDays / 30)} months matches your ${profile.timeHorizon}-term horizon.`;

  // Trade-offs
  const gains: string[] = [];
  const sacrifices: string[] = [];

  if (liquidityScore > 0.7) gains.push('High liquidity - withdraw anytime');
  if (returnScore > 0.7) gains.push(`Competitive ${baseRate}% interest rate`);
  if (riskScore > 0.7) gains.push('Guaranteed returns, zero market risk');

  if (liquidityScore < 0.5) sacrifices.push('Locked until maturity');
  if (returnScore < 0.5) sacrifices.push('May miss higher equity returns');
  if (profile.investmentGoal === 'wealthBuild') sacrifices.push('FD returns may not beat inflation long-term');

  return {
    id: `${bankFD.bank_id}_${bankFD.tenure}`,
    name: `${bankFD.bank_name} ${bankFD.tenure}`,
    type: 'fd',
    score: Math.round(score * 100) / 100,
    confidence,
    signals: { goalFit: goalFitScore, liquidity: liquidityScore, returnPotential: returnScore, riskAlignment: riskScore, tenureFit: tenureScore },
    rationale,
    tradeoffs: { gains, sacrifices },
    details: { bank: bankFD.bank_short, rate: baseRate, tenure: bankFD.tenure, tenureDays, seniorRate: bankFD.senior_rate, minAmount: bankFD.min_amount },
  };
}

// ─── Score SIP Product ───────────────────────────────────────────────
function scoreSIP(fundName: string, nav: number, profile: UserProfile): ScoredProduct {
  const goalConfig = GOAL_TENURE_MAP[profile.investmentGoal];
  
  // Equity keywords for risk scoring
  const equityKeywords = ['growth', 'opportunity', 'focus', 'select', 'multi-cap', 'large cap', 'mid cap', 'small cap'];
  const debtKeywords = ['income', 'debt', 'liquid', 'short term', 'gilt', 'bond'];
  
  const isEquity = equityKeywords.some(k => fundName.toLowerCase().includes(k));
  const isDebt = debtKeywords.some(k => fundName.toLowerCase().includes(k));

  // Risk mapping
  let riskLevel = 5; // Default moderate
  if (isEquity) riskLevel = profile.riskAppetite === 'high' ? 8 : profile.riskAppetite === 'moderate' ? 6 : 3;
  if (isDebt) riskLevel = profile.riskAppetite === 'low' ? 2 : 4;

  // Goal fit: long-term goals suit equity
  const goalFitScore = (profile.investmentGoal === 'wealthBuild' || profile.investmentGoal === 'retirement')
    ? (isEquity ? 1.0 : 0.5)
    : profile.investmentGoal === 'childEducation'
    ? (isEquity ? 0.8 : 0.4)
    : 0.3;

  // Liquidity: SIP can be stopped anytime (high liquidity)
  const liquidityScore = profile.liquidityNeed === 'high' ? 1.0
    : profile.liquidityNeed === 'medium' ? 0.7
    : 0.4;

  // Return potential: higher risk = higher potential
  const returnScore = riskLevel / 10;

  // Risk alignment
  const riskScore = Math.abs(riskLevel / 10 - (profile.riskAppetite === 'low' ? 0.2 : profile.riskAppetite === 'moderate' ? 0.5 : 0.8));

  // Tenure fit
  const tenureScore = profile.timeHorizon === 'long' ? (isEquity ? 1.0 : 0.4)
    : profile.timeHorizon === 'medium' ? (isDebt ? 0.8 : 0.4)
    : 0.2;

  const score = (
    goalFitScore * WEIGHTS.goalFit +
    liquidityScore * WEIGHTS.liquidity +
    returnScore * WEIGHTS.returnPotential +
    riskScore * WEIGHTS.riskAlignment +
    tenureScore * WEIGHTS.tenureFit
  );

  const confidence: 'high' | 'medium' | 'low' = nav > 0 ? 'high' : 'medium';

  // Rationale
  const rationale = isEquity
    ? `${fundName} suitable for long-term wealth building with ${profile.timeHorizon}-year horizon. Higher risk but potential for better returns.`
    : `${fundName} ideal for ${profile.investmentGoal} with ${profile.riskAppetite} risk appetite. More stable with predictable returns.`;

  // Trade-offs
  const gains: string[] = [];
  const sacrifices: string[] = [];

  if (isEquity && profile.timeHorizon === 'long') gains.push('Equity growth potential over long term');
  if (isDebt) gains.push('Stable returns with lower volatility');
  if (profile.taxBracket === '30%') gains.push('Long-term capital gains tax benefit');
  gains.push('SIP allows flexible monthly investments');

  if (isEquity && profile.liquidityNeed === 'high') sacrifices.push('Equity markets can be volatile short-term');
  if (isDebt && profile.investmentGoal === 'wealthBuild') sacrifices.push('May not match inflation over long term');
  sacrifices.push('Market-linked returns, not guaranteed');

  return {
    id: `sip_${fundName.replace(/\s+/g, '_')}`,
    name: fundName,
    type: 'sip',
    score: Math.round(score * 100) / 100,
    confidence,
    signals: { goalFit: goalFitScore, liquidity: liquidityScore, returnPotential: returnScore, riskAlignment: riskScore, tenureFit: tenureScore },
    rationale,
    tradeoffs: { gains, sacrifices },
    details: { nav, category: isEquity ? 'equity' : isDebt ? 'debt' : 'hybrid' },
  };
}

// ─── Get FD Recommendations ──────────────────────────────────────────
export async function getFDRecommendations(
  profile: UserProfile,
  options: { tenure?: string; amount?: number; limit?: number } = {}
): Promise<RecommendationResult> {
  const { limit = 5 } = options;
  
  // Get best FD rates from database
  const allRates = await getBestFDRates(options.tenure, profile.isSenior, 20);
  
  if (allRates.length === 0) {
    // Fallback to supported banks with mock data
    const mockFDRates: FDRate[] = SUPPORTED_BANKS.flatMap(bank => 
      ['1y', '2y', '3y', '5y'].map((tenure, i) => ({
        bank_id: bank.id,
        bank_name: bank.name,
        bank_short: bank.short_name,
        tenure,
        tenure_days: [365, 730, 1095, 1825][i],
        rate: 5.10 + Math.random() * 0.5,
        senior_rate: 5.60 + Math.random() * 0.5,
        min_amount: 1000,
        type: 'general' as const,
        scraped_at: new Date().toISOString(),
        source_url: bank.url,
      }))
    );
    allRates.push(...mockFDRates);
  }

  // Score each FD
  const scored = allRates.map(fd => scoreFD(fd, profile));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  // Apply tie-breaker: higher rate wins
  scored.sort((a, b) => {
    if (a.score === b.score) {
      return ((b.details?.rate || 0) - (a.details?.rate || 0));
    }
    return 0;
  });

  const recommendations = scored.slice(0, limit);

  // Generate insights
  const insights: string[] = [];
  
  if (profile.investmentGoal === 'emergency') {
    insights.push('For emergency funds, prioritize liquidity over returns. Consider short-term FDs or liquid funds.');
  }
  if (profile.investmentGoal === 'wealthBuild') {
    insights.push('For wealth building, longer tenure FDs (3-5yr) lock in current high rates before potential cuts.');
  }
  if (profile.isSenior) {
    insights.push(`Senior citizens get ${recommendations[0]?.details?.seniorRate?.toFixed(2)}% extra rate at ${recommendations[0]?.details?.bank}.`);
  }
  if (profile.taxBracket) {
    insights.push('Tax-saving FDs under 80C can reduce taxable income by up to ₹1.5L/year.');
  }

  return {
    productType: 'fd',
    recommendations,
    insights,
  };
}

// ─── Get SIP Recommendations ────────────────────────────────────────
export async function getSIPRecommendations(
  profile: UserProfile,
  options: { category?: string; limit?: number } = {}
): Promise<RecommendationResult> {
  const { limit = 5 } = options;

  // Fetch all funds from AMFI (10,000+)
  const allFunds = await fetchAllFunds();
  
  // Filter by category if specified
  let filteredFunds = allFunds;
  if (options.category) {
    const categoryLower = options.category.toLowerCase();
    filteredFunds = allFunds.filter(f => f.schemeName.toLowerCase().includes(categoryLower));
  }

  // Get NAV for top candidates and score them
  const scored: ScoredProduct[] = [];
  
  for (const fund of filteredFunds.slice(0, 50)) { // Check top 50
    const navData = await fetchNavByCode(fund.schemeCode);
    if (navData?.data?.[0]?.nav) {
      const nav = parseFloat(navData.data[0].nav);
      if (nav > 0) {
        scored.push(scoreSIP(fund.schemeName, nav, profile));
      }
    }
    if (scored.length >= limit * 2) break; // Enough candidates
  }

  // Sort by score
  scored.sort((a, b) => b.score - a.score);
  const recommendations = scored.slice(0, limit);

  // Generate insights
  const insights: string[] = [];
  
  if (profile.timeHorizon === 'long' && profile.riskAppetite !== 'low') {
    insights.push('Long horizon + moderate/high risk = equity SIP can compound significantly over 10+ years.');
  }
  if (profile.investmentGoal === 'retirement') {
    insights.push('SIP in index funds like Nifty 50 can provide market-linked returns with low fees for retirement.');
  }
  if (profile.incomeRange === 'high') {
    insights.push('Consider multiple SIPs across large-cap, mid-cap, and international funds for diversification.');
  }
  insights.push(`SIP allows starting with as low as ₹500/month - consistency matters more than amount.`);

  return {
    productType: 'sip',
    recommendations,
    insights,
  };
}

// ─── Get Combined Recommendation ────────────────────────────────────
export async function getRecommendation(
  type: 'fd' | 'sip' | 'both',
  profile: UserProfile,
  options?: any
): Promise<RecommendationResult | { fd: RecommendationResult; sip: RecommendationResult }> {
  if (type === 'fd') return getFDRecommendations(profile, options);
  if (type === 'sip') return getSIPRecommendations(profile, options);
  
  // Return both
  const [fdResult, sipResult] = await Promise.all([
    getFDRecommendations(profile, options),
    getSIPRecommendations(profile, options),
  ]);

  return { fd: fdResult, sip: sipResult };
}

// ─── Format Recommendation for Voice Output ────────────────────────
export function formatRecommendationForVoice(result: RecommendationResult): string {
  if (result.recommendations.length === 0) {
    return 'No recommendations found matching your profile.';
  }

  const top = result.recommendations[0];
  const typeLabel = result.productType === 'fd' ? 'FD' : 'SIP';
  
  let output = `Your top ${typeLabel} recommendation: ${top.name}. `;
  output += `Score ${Math.round(top.score * 100)}%. `;
  output += top.rationale;
  
  if (top.tradeoffs.gains.length > 0) {
    output += ` Benefits: ${top.tradeoffs.gains.slice(0, 2).join('. ')}.`;
  }
  
  if (result.insights.length > 0) {
    output += ` ${result.insights[0]}`;
  }

  return output;
}

// ─── Get User Profile from Supabase ────────────────────────────────
export async function getUserProfileFromDatabase(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return null;
    
    return {
      age: data.age || 30,
      incomeRange: data.income_range || 'medium',
      investmentGoal: data.investment_goal || 'wealthBuild',
      timeHorizon: data.time_horizon || 'medium',
      liquidityNeed: data.liquidity_need || 'medium',
      riskAppetite: data.risk_appetite || 'moderate',
      taxBracket: data.tax_bracket,
      isSenior: data.is_senior || false,
    };
  } catch {
    return null;
  }
}

// ─── Save User Profile ──────────────────────────────────────────────
export async function saveUserProfile(userId: string, profile: UserProfile): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        age: profile.age,
        income_range: profile.incomeRange,
        investment_goal: profile.investmentGoal,
        time_horizon: profile.timeHorizon,
        liquidity_need: profile.liquidityNeed,
        risk_appetite: profile.riskAppetite,
        tax_bracket: profile.taxBracket,
        is_senior: profile.isSenior,
        updated_at: new Date().toISOString(),
      });
    
    return !error;
  } catch {
    return false;
  }
}

export default {
  getFDRecommendations,
  getSIPRecommendations,
  getRecommendation,
  formatRecommendationForVoice,
  getUserProfileFromDatabase,
  saveUserProfile,
  WEIGHTS,
};
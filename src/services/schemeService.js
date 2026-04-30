// Scheme Detection Service - Stub implementation
// TODO: Implement full scheme detection logic

export function detectSchemeIntent(text) {
  const textLower = text.toLowerCase();
  
  const schemePatterns = [
    { keywords: ['kisan', 'farmer', 'kheti'], scheme: 'pm_kisan' },
    { keywords: ['jeevan bima', 'life insurance', 'bima'], scheme: 'jeevan_suraksha' },
    { keywords: ['sukanya', 'beti', 'daughter'], scheme: 'sukanya_samriddhi' },
    { keywords: ['pension', 'retired', 'retire'], scheme: 'atal_pension' },
    { keywords: ['mudra', 'loan', 'udyog'], scheme: 'mudra_loan' },
    { keywords: ['jan dhan', 'bank account'], scheme: 'jan_dhan' },
    { keywords: ['pmjjby', 'suraksha bima'], scheme: 'pmjjby' },
  ];
  
  for (const pattern of schemePatterns) {
    if (pattern.keywords.some(k => textLower.includes(k))) {
      return { scheme: pattern.scheme, confidence: 0.8 };
    }
  }
  
  return null;
}
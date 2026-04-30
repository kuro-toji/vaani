// Eligibility Detection Service - Stub implementation

export function detectEligibilityIntent(text) {
  const textLower = text.toLowerCase();
  
  const patterns = [
    { keywords: ['pmjjby'], scheme: 'pmjjby' },
    { keywords: ['atal pension', 'pension'], scheme: 'atal_pension' },
    { keywords: ['apgy', 'maternity'], scheme: 'apgy' },
    { keywords: ['sukanya'], scheme: 'sukanya_samriddhi' },
  ];
  
  for (const p of patterns) {
    if (p.keywords.some(k => textLower.includes(k))) return p.scheme;
  }
  
  return null;
}
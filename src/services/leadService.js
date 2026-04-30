// Lead Service - Stub implementation

export function detectProductInterest(text) {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('fd') || textLower.includes('fixed deposit') || textLower.includes('bank deposit')) return 'fd';
  if (textLower.includes('crypto') || textLower.includes('bitcoin')) return 'crypto';
  if (textLower.includes('sip') || textLower.includes('mutual fund')) return 'sip';
  if (textLower.includes('insurance') || textLower.includes('bima')) return 'insurance';
  if (textLower.includes('loan')) return 'loan';
  if (textLower.includes('tax') || textLower.includes('tax saving')) return 'tax_saving';
  
  return null;
}
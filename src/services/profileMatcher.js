// Profile Matcher Service - Stub implementation

export function detectProfileFromText(text) {
  const textLower = text.toLowerCase();
  const profile = {};
  
  // Detect occupation
  if (textLower.includes('farmer') || textLower.includes('kisan')) profile.occupation = 'farmer';
  else if (textLower.includes('student')) profile.occupation = 'student';
  else if (textLower.includes('business') || textLower.includes('shopkeeper')) profile.occupation = 'business';
  
  // Detect age
  const ageMatch = text.match(/(\d+)\s*(?:years?|saal|varsh)/i);
  if (ageMatch) profile.age = ageMatch[1];
  
  // Detect gender
  if (textLower.includes('male') || textLower.includes('aadmi') || textLower.includes('men')) profile.gender = 'male';
  else if (textLower.includes('female') || textLower.includes('aurat') || textLower.includes('women')) profile.gender = 'female';
  
  return profile;
}

export function matchSchemesToProfile(profile) {
  const schemes = [
    { id: 'pm_kisan', description: 'PM Kisan Samman Nidhi', keywords: ['farmer'] },
    { id: 'sukanya_samriddhi', description: 'Sukanya Samriddhi Yojana', keywords: ['female', 'daughter'] },
    { id: 'pmjjby', description: 'Pradhan Mantri Jeevan Jyoti Bima Yojana', keywords: ['insurance'] },
    { id: 'mudra_loan', description: 'Mudra Yojana', keywords: ['business', 'loan'] },
  ];
  
  return schemes.filter(scheme => {
    return scheme.keywords.some(k => profile.occupation?.includes(k) || profile.gender?.includes(k));
  });
}
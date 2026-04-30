// Financial product → regional dialect metaphors
// Key: financial concept
// Value: array of { dialect, language, metaphor, explanation }
export const dialectMetaphors = {
  'fixedDeposit': [
    {
      concept: 'Fixed Deposit',
      metaphor: 'Galla Band',
      dialect: 'Bhojpuri',
      language: 'Bhojpuri',
      literalMeaning: 'Locking the grain',
      explanation: 'Just like locking grain in a storeroom to keep it safe until needed, FD locks your money safely in the bank.',
      usage: 'Bhojpuri-speaking regions of Bihar, Jharkhand, Uttar Pradesh'
    },
    {
      concept: 'Fixed Deposit',
      metaphor: 'Chhata Paise',
      dialect: 'Awadhi',
      language: 'Awadhi', 
      literalMeaning: 'Shadow money',
      explanation: 'Money that stays with you like your shadow - always there when you need it, growing slowly.',
      usage: 'Awadhi-speaking regions of Uttar Pradesh'
    },
    {
      concept: 'Fixed Deposit',
      metaphor: 'Nani Ki Peti',
      dialect: 'Rajasthani',
      language: 'Rajasthani',
      literalMeaning: "Grandmother's trunk",
      explanation: 'Like the strongbox where grandmother keeps gold safe for generations.',
      usage: 'Rajasthani-speaking regions'
    },
    {
      concept: 'Mutual Fund',
      metaphor: 'Gaon Ka Samudaya',
      dialect: 'Hindi',
      language: 'Hindi',
      literalMeaning: 'Village community pool',
      explanation: 'Everyone puts money in a common pot, a wise person invests it, and all share the profits.',
      usage: 'Rural Hindi-speaking areas'
    },
    {
      concept: 'SIP',
      metaphor: 'Hafta Waala',
      dialect: 'Punjabi',
      language: 'Punjabi',
      literalMeaning: 'Weekly contribution',
      explanation: 'Like the hafta system - putting aside a little every week that grows into a large amount.',
      usage: 'Punjab'
    },
    {
      concept: 'Gold Bond',
      metaphor: 'Digital Sona',
      dialect: 'Bengali',
      language: 'Bengali',
      literalMeaning: 'Paper gold',
      explanation: 'Owning gold on paper - no fear of theft, no making charges, but still gold ki kimat.',
      usage: 'Bengal'
    },
    {
      concept: 'PPF',
      metaphor: 'Desh Ki Nirmati',
      dialect: 'Hindi',
      language: 'Hindi',
      literalMeaning: "Nation's savings",
      explanation: 'Like contributing to the nation building while your money grows tax-free.',
      usage: 'Pan-India'
    },
    {
      concept: 'Insurance',
      metaphor: 'Parivar Ki Raksha',
      dialect: 'Hindi',
      language: 'Hindi',
      literalMeaning: 'Family protection',
      explanation: 'Like building a protective wall around your family against storms.',
      usage: 'Pan-India'
    },
    {
      concept: 'Emergency Fund',
      metaphor: 'Gharelu',
      dialect: 'Marathi',
      language: 'Marathi',
      literalMeaning: 'Home cushion',
      explanation: 'Like having a soft cushion at home for when someone falls - you dont need it until you need it.',
      usage: 'Maharashtra'
    },
    {
      concept: 'Retirement',
      metaphor: 'Chaitra Math',
      dialect: 'Tamil',
      language: 'Tamil',
      literalMeaning: 'Spring harvest',
      explanation: 'Like the spring harvest - all your hard work through the year pays off in one season.',
      usage: 'Tamil Nadu'
    }
  ],
  // Life events → financial goals
  'lifeEvents': [
    {
      event: 'शादी',
      goal: 'Marriage Fund',
      suggestion: 'Start FD with compound interest, aim for 3-5 years before wedding',
      metaphors: ['Gaon Ka Samm', 'Chhata Paise']
    },
    {
      event: 'पढ़ाई',
      goal: 'Education Fund',
      suggestion: 'PPF for long-term, SIP for medium-term',
      metaphors: ['Desh Ki Nirmati']
    },
    {
      event: 'बच्चे',
      goal: 'Child Future',
      suggestion: 'Sukanya Samriddhi for girl child, PPF for all',
      metaphors: ['Nani Ki Peti']
    },
    {
      event: 'घर',
      goal: 'Home Fund',
      suggestion: 'FD ladder strategy, balance safety with returns',
      metaphors: ['Galla Band']
    },
    {
      event: 'स्वास्थ्य',
      goal: 'Health Emergency',
      suggestion: 'Health insurance first, then build emergency fund',
      metaphors: ['Parivar Ki Raksha']
    },
    {
      event: 'खेती',
      goal: 'Agriculture',
      suggestion: 'Kisan Vikas Patra, post office schemes',
      metaphors: ['Gaon Ka Samudaya']
    }
  ],
  // Trust metaphors for rural users
  'trust': [
    {
      concept: 'Vaani',
      metaphor: 'Gaon Ka Sarpanch',
      dialect: 'Hindi',
      language: 'Hindi',
      literalMeaning: 'Village head',
      explanation: 'Vaani is like the sarpanch of your village who knows about money — free advice, no hidden agenda.',
      usage: 'Rural Hindi-speaking areas'
    },
    {
      concept: 'Vaani',
      metaphor: 'Padha-Likha Rishtedar',
      dialect: 'Hindi',
      language: 'Hindi',
      literalMeaning: 'Educated relative',
      explanation: 'Using Vaani is like asking your most educated relative for money advice — no cost, no judgment.',
      usage: 'Pan-India'
    }
  ]
};

export function getMetaphor(concept, dialect = 'Hindi') {
  const metaphors = dialectMetaphors[concept];
  if (!metaphors) return null;
  
  // Find best match for dialect
  const match = metaphors.find(m => 
    m.dialect.toLowerCase() === dialect.toLowerCase() ||
    m.language.toLowerCase() === dialect.toLowerCase()
  );
  
  return match || metaphors[0]; // Fallback to first (Hindi)
}

export function getLifeEventMeta(event) {
  return dialectMetaphors.lifeEvents.find(le => 
    le.event.includes(event) || event.includes(le.event)
  );
}
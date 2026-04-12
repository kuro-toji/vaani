/**
 * Life-Event Intelligence Service
 * 
 * Scans conversations to detect major life events (wedding, harvest, education, etc.)
 * and automatically generates an investment ladder suited to the timeline.
 */

export const LIFE_EVENTS = {
  MARRIAGE: 'marriage',
  EDUCATION: 'education',
  HARVEST: 'harvest',
  EMERGENCY: 'emergency',
  RETIREMENT: 'retirement'
};

const EVENT_KEYWORDS = {
  [LIFE_EVENTS.MARRIAGE]: ['शादी', 'विवाह', 'marriage', 'wedding', 'beti', 'kanya'],
  [LIFE_EVENTS.EDUCATION]: ['पढ़ाई', 'स्कूल', 'फीस', 'education', 'school', 'college', 'admission'],
  [LIFE_EVENTS.HARVEST]: ['फसल', 'कटाई', 'harvest', 'kheti', 'mandi'],
  [LIFE_EVENTS.EMERGENCY]: ['आपातकाल', 'अस्पताल', 'इलाज', 'emergency', 'hospital', 'operation', 'bimar'],
  [LIFE_EVENTS.RETIREMENT]: ['रिटायरमेंट', 'सेवानिवृत्ति', 'बुढ़ापा', 'pension', 'retirement']
};

export function detectLifeEvents(messages) {
  if (!messages || messages.length === 0) return null;

  // Only scan user messages
  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length === 0) return null;

  // Look at the last few messages to keep context fresh
  const recentMessages = userMessages.slice(-3);
  const text = recentMessages.map(m => m.content.toLowerCase()).join(' ');

  let detectedEvent = null;

  for (const [event, keywords] of Object.entries(EVENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        detectedEvent = event;
        break;
      }
    }
    if (detectedEvent) break;
  }

  return detectedEvent;
}

export function buildInvestmentLadder(eventType, amount = 100000) {
  // Mock generation of an investment ladder based on life event
  // In a real app, this would use LLM or more complex rules engine
  const ladder = {
    title: '',
    allocations: []
  };

  const formattedAmount = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumSignificantDigits: 3 }).format(val);

  switch (eventType) {
    case LIFE_EVENTS.MARRIAGE:
      ladder.title = 'शादी का निवेश प्लान (Marriage Plan)';
      ladder.allocations = [
        { purpose: 'Immediate Expenses', instrument: 'Liquid Fund/FD', percentage: 20, amount: formattedAmount(amount * 0.20), timeline: 'Anytime access' },
        { purpose: 'Jewelry/Gold', instrument: 'Sovereign Gold Bond', percentage: 40, amount: formattedAmount(amount * 0.40), timeline: 'Hold 5-8 years' },
        { purpose: 'Wedding Venue/Core', instrument: 'Equity Mutual Fund', percentage: 40, amount: formattedAmount(amount * 0.40), timeline: 'Need in 3+ years' }
      ];
      break;

    case LIFE_EVENTS.EDUCATION:
      ladder.title = 'बच्चों की पढ़ाई (Education Plan)';
      ladder.allocations = [
        { purpose: 'School Fees', instrument: 'Recurring Deposit', percentage: 30, amount: formattedAmount(amount * 0.30), timeline: 'Need yearly' },
        { purpose: 'Higher Education', instrument: 'Sukanya Samriddhi / PPF', percentage: 40, amount: formattedAmount(amount * 0.40), timeline: 'Lock until age 18' },
        { purpose: 'College Fund', instrument: 'Index Mutual Fund', percentage: 30, amount: formattedAmount(amount * 0.30), timeline: 'Hold 10+ years' }
      ];
      break;

    case LIFE_EVENTS.HARVEST:
      ladder.title = 'फसल की कमाई (Harvest Season Plan)';
      ladder.allocations = [
        { purpose: 'Next Seeds/Fertilizer', instrument: 'Savings / Liquid Fund', percentage: 40, amount: formattedAmount(amount * 0.40), timeline: 'Need in 6 months' },
        { purpose: 'Equipment/Tractor', instrument: 'Kisan Vikas Patra', percentage: 30, amount: formattedAmount(amount * 0.30), timeline: 'Long term growth' },
        { purpose: 'Family Savings', instrument: 'Fixed Deposit', percentage: 30, amount: formattedAmount(amount * 0.30), timeline: '1-3 years' }
      ];
      break;

    case LIFE_EVENTS.EMERGENCY:
      ladder.title = 'आपातकालीन फंड (Emergency Plan)';
      ladder.allocations = [
        { purpose: 'Immediate Cash', instrument: 'Savings Account', percentage: 50, amount: formattedAmount(amount * 0.50), timeline: 'Instant access' },
        { purpose: 'Health Insurance Premium', instrument: 'Health Policy', percentage: 10, amount: formattedAmount(amount * 0.10), timeline: 'Must have' },
        { purpose: 'Accessible Buffer', instrument: 'Bank FD', percentage: 40, amount: formattedAmount(amount * 0.40), timeline: 'Breakable anytime' }
      ];
      break;

    case LIFE_EVENTS.RETIREMENT:
      ladder.title = 'सेवानिवृत्ति (Retirement Plan)';
      ladder.allocations = [
        { purpose: 'Regular Income', instrument: 'SCSS (Senior Citizen)', percentage: 50, amount: formattedAmount(amount * 0.50), timeline: 'Guaranteed payout' },
        { purpose: 'Capital Growth', instrument: 'Balanced Mutual Fund', percentage: 30, amount: formattedAmount(amount * 0.30), timeline: 'Beat inflation' },
        { purpose: 'Medical Reserve', instrument: 'Liquid Fund', percentage: 20, amount: formattedAmount(amount * 0.20), timeline: 'Instant access' }
      ];
      break;
      
    default:
      return null;
  }

  return ladder;
}

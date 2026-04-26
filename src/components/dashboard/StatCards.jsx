import { motion } from 'framer-motion';

export default function StatCards() {
  const cards = [
    {
      icon: '💰',
      label: 'Total Invested',
      sub: 'कुल निवेश',
      amount: '₹1,40,000',
      delta: '+₹500 this month',
      positive: true,
    },
    {
      icon: '📅',
      label: 'Next Maturity',
      sub: 'अगली परिपक्वता',
      amount: '₹14,200',
      subtext: '23 din mein milega',
      progress: 72,
    },
    {
      icon: '🏆',
      label: 'TDS Saved',
      sub: 'TDS बचाया',
      amount: '₹840',
      subtext: 'earnured on ₹1L',
    },
  ];

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: 'easeOut' }}
          style={{
            flex: '1 1 200px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '24px' }}>{card.icon}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{card.sub}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 600 }}>{card.label}</div>
            </div>
          </div>
          <div style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {card.amount}
          </div>
          {card.delta && (
            <div style={{ color: '#10B981', fontSize: '12px', fontWeight: 600 }}>{card.delta}</div>
          )}
          {card.subtext && (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{card.subtext}</div>
          )}
          {card.progress !== undefined && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>72% complete</span>
                <span style={{ color: '#FF6B00', fontSize: '11px', fontWeight: 600 }}>23 days left</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '72%', height: '100%', background: 'linear-gradient(90deg, #FF6B00, #FF8530)', borderRadius: '4px' }} />
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
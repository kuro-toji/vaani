import { motion } from 'framer-motion';

const GOALS = [
  {
    name: 'Beti ki Shaadi',
    nameHin: 'बेटी की शादी',
    icon: '💍',
    target: 200000,
    current: 142000,
    monthsLeft: 6,
    color: '#FF6B00',
  },
  {
    name: 'Naya Tractor',
    nameHin: 'नया ट्रैक्टर',
    icon: '🚜',
    target: 80000,
    current: 65000,
    monthsLeft: 4,
    color: '#1D9E75',
  },
  {
    name: 'Ghar ki Chhat',
    nameHin: 'घर की छत',
    icon: '🏠',
    target: 150000,
    current: 38000,
    monthsLeft: 12,
    color: '#534AB7',
  },
  {
    name: 'Bachche ki Padhai',
    nameHin: 'बच्चे की पढ़ाई',
    icon: '📚',
    target: 100000,
    current: 90000,
    monthsLeft: 2,
    color: '#00D4AA',
  },
];

function formatINR(n) {
  return '₹' + n.toLocaleString('en-IN');
}

export default function GoalsSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.56, duration: 0.4, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>Goals</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>लक्ष्य · Financial targets</p>
        </div>
        <button style={{
          background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)',
          borderRadius: '8px', padding: '6px 14px',
          color: '#FF6B00', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
        }}>+ Add Goal</button>
      </div>

      <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '8px' }}>
        {GOALS.map((goal, i) => {
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <motion.div
              key={goal.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.60 + i * 0.08, duration: 0.35, ease: 'backOut' }}
              style={{
                flexShrink: 0,
                width: '180px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '22px' }}>{goal.icon}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                  borderRadius: '6px', color: goal.color,
                  background: `${goal.color}18`, border: `1px solid ${goal.color}30`,
                }}>
                  {goal.monthsLeft}mo
                </span>
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{goal.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{goal.nameHin}</div>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>
                {formatINR(goal.current)}
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: 400 }}>
                  {' '}/ {formatINR(goal.target)}
                </span>
              </div>
              <div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.72 + i * 0.08, duration: 0.6, ease: 'easeOut' }}
                    style={{ height: '100%', background: goal.color, borderRadius: '3px' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{pct}%</span>
                  <span style={{ color: goal.color, fontSize: '10px', fontWeight: 600 }}>{goal.monthsLeft} months left</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
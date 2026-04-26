import { motion } from 'framer-motion';

const FDS = [
  { bank: 'Suryoday', amount: '₹30,000', maturity: '15 Jun 2026', rate: '8.25%', color: '#FF6B00', monthsLeft: 2 },
  { bank: 'Utkarsh',   amount: '₹25,000', maturity: '3 Sep 2026', rate: '7.75%', color: '#1D9E75', monthsLeft: 5 },
  { bank: 'Jana',     amount: '₹40,000', maturity: '22 Dec 2026', rate: '8.10%', color: '#534AB7', monthsLeft: 8 },
  { bank: 'Suryoday', amount: '₹20,000', maturity: '7 Mar 2027', rate: '8.40%', color: '#FF6B00', monthsLeft: 11 },
  { bank: 'Utkarsh',  amount: '₹25,000', maturity: '1 Jul 2027', rate: '7.90%', color: '#1D9E75', monthsLeft: 15 },
];

const EVENTS = [
  { label: 'Beti ki Shaadi', date: 'Oct 2026', icon: '💍', color: '#FF6B00' },
  { label: 'Tractor ka EMI', date: 'Dec 2026', icon: '🚜', color: '#1D9E75' },
  { label: 'Ghar Repair',    date: 'Mar 2027', icon: '🔨', color: '#534AB7' },
];

const MAX_MONTHS = 18;
const now = new Date('2026-04-26');

function monthsUntil(dateStr) {
  const d = new Date(dateStr);
  return Math.max(0, Math.round((d - now) / (1000 * 60 * 60 * 24 * 30)));
}

export default function FDLadderTimeline() {
  const totalBar = MAX_MONTHS * 40; // 40px per month

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.4, ease: 'easeOut' }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px 24px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>FD Ladder Timeline</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>FD लैडर · Staggered maturities</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {Object.entries({ Suryoday: '#FF6B00', Utkarsh: '#1D9E75', Jana: '#534AB7' }).map(([bank, color]) => (
            <div key={bank} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{bank}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline track */}
      <div style={{ position: 'relative', paddingBottom: '24px' }}>
        {/* Progress bar background */}
        <div style={{
          height: '6px', background: 'rgba(255,255,255,0.08)',
          borderRadius: '3px', position: 'relative', overflow: 'hidden',
        }}>
          {/* Animated progress fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(monthsUntil('Apr 2026') / MAX_MONTHS) * 100}%` }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, rgba(255,107,0,0.3), rgba(255,107,0,0.15))',
              borderRadius: '3px',
            }}
          />
          {/* Now marker */}
          <div style={{
            position: 'absolute', left: `${(monthsUntil('Apr 2026') / MAX_MONTHS) * 100}%`,
            top: '-4px', width: '2px', height: '14px',
            background: '#FF6B00', borderRadius: '1px',
          }} />
        </div>

        {/* Month labels */}
        <div style={{ display: 'flex', marginTop: '6px', gap: '0' }}>
          {['Now', 'Jun', 'Sep', 'Dec', 'Mar 27', 'Jul 27'].map((label, i) => (
            <span key={label} style={{
              color: 'rgba(255,255,255,0.3)', fontSize: '10px', width: `${100 / 6}%`,
              textAlign: i === 0 ? 'left' : 'center',
            }}>{label}</span>
          ))}
        </div>

        {/* FD pills */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
          {FDS.map((fd, i) => {
            const ml = fd.monthsLeft;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.32 + i * 0.08, duration: 0.35, ease: 'backOut' }}
                style={{
                  flexShrink: 0,
                  background: `${fd.color}18`,
                  border: `1.5px solid ${fd.color}50`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  minWidth: '130px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: fd.color }}>{fd.bank}</div>
                <div style={{ color: '#fff', fontSize: '15px', fontWeight: 800 }}>{fd.amount}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{fd.rate} p.a.</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px' }}>{fd.maturity}</div>
                <div style={{
                  marginTop: '4px', fontSize: '10px', fontWeight: 600,
                  color: fd.color, background: `${fd.color}20`,
                  borderRadius: '6px', padding: '2px 8px', display: 'inline-block', width: 'fit-content',
                }}>
                  {ml} months
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Event markers */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', overflowX: 'auto' }}>
          {EVENTS.map((ev, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px', padding: '6px 12px', flexShrink: 0,
            }}>
              <span>{ev.icon}</span>
              <div>
                <div style={{ color: '#fff', fontSize: '11px', fontWeight: 600 }}>{ev.label}</div>
                <div style={{ color: ev.color, fontSize: '10px' }}>{ev.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
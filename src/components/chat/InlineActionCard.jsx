import { motion } from 'framer-motion';

export function FDActionCard({ bank, rate, amount, maturity, onAction }) {
  const color = bank === 'Suryoday' ? '#FF6B00' : bank === 'Utkarsh' ? '#1D9E75' : '#534AB7';
  return (
    <div style={{
      background: 'rgba(15,46,43,0.9)',
      border: `1px solid ${color}40`,
      borderRadius: '12px',
      padding: '14px',
      marginTop: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color, fontFamily: '"Noto Sans Devanagari", sans-serif' }}>
          {bank}
        </span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{rate} p.a.</span>
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Amount</div>
          <div style={{ color: '#fff', fontSize: '15px', fontWeight: 800 }}>{amount}</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Maturity</div>
          <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{maturity}</div>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onAction}
        style={{
          background: `${color}`,
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          color: '#fff',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: '"Noto Sans Devanagari", sans-serif',
          alignSelf: 'flex-end',
        }}
      >
        Lagao →
      </motion.button>
    </div>
  );
}

export function GoalCard({ name, nameHin, target, current, monthsLeft, onAction }) {
  const pct = Math.round((current / target) * 100);
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '14px',
      marginTop: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{name}</span>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{nameHin}</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#00D4AA', borderRadius: '4px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{pct}% complete</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>{monthsLeft} months</span>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onAction}
        style={{
          background: 'rgba(0,212,170,0.15)',
          border: '1px solid rgba(0,212,170,0.3)',
          borderRadius: '8px',
          padding: '6px 14px',
          color: '#00D4AA',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: '"Noto Sans Devanagari", sans-serif',
        }}
      >
        Track karo →
      </motion.button>
    </div>
  );
}

export function WarningCard({ message }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: '12px',
      padding: '12px 14px',
      marginTop: '10px',
      display: 'flex',
      gap: '10px',
      alignItems: 'flex-start',
    }}>
      <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
      <p style={{
        color: 'rgba(255,200,200,0.9)', fontSize: '12px', margin: 0,
        lineHeight: 1.5, fontFamily: '"Noto Sans Devanagari", sans-serif',
      }}>{message}</p>
    </div>
  );
}
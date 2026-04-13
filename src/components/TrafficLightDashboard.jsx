import { useEffect, useState } from 'react';

/**
 * TrafficLightDashboard — Simplicity Mode for Elderly Users.
 * 
 * Replaces all charts/numbers with a single glowing color:
 * GREEN  = money safe & growing
 * YELLOW = big expense coming soon  
 * RED    = balance is critically low
 *
 * Props:
 *   balance  {number} — current account balance (0 if unknown)
 *   lastMsg  {string} — last AI response text
 *   onAsk    {function} — called when user taps the glowing ball (sends a preset question)
 */
export default function TrafficLightDashboard({ balance = 0, lastMsg = '', onAsk }) {
  const [status, setStatus] = useState('green'); // 'green' | 'yellow' | 'red'
  const [label, setLabel] = useState('');
  const [sublabel, setSublabel] = useState('');

  useEffect(() => {
    const msg = lastMsg.toLowerCase();
    const isWarning = /low|kam|warning|expense|kharch|bill|emi|due|girna|khatam/.test(msg);
    const isDanger = /critical|urgent|zero|empty|khatm|balance nahi|insufficient/.test(msg);

    if (isDanger || balance < 100) {
      setStatus('red');
      setLabel('⚠️ पैसे कम हैं');
      setSublabel('Tap to know what to do');
    } else if (isWarning || balance < 1000) {
      setStatus('yellow');
      setLabel('📋 ध्यान दें');
      setSublabel('An expense may be due soon');
    } else {
      setStatus('green');
      setLabel('✅ सब ठीक है');
      setSublabel('Your money is safe');
    }
  }, [balance, lastMsg]);

  const COLORS = {
    green:  { bg: '#10B981', glow: 'rgba(16,185,129,0.6)',  outer: 'rgba(16,185,129,0.2)' },
    yellow: { bg: '#F59E0B', glow: 'rgba(245,158,11,0.6)',  outer: 'rgba(245,158,11,0.2)'  },
    red:    { bg: '#EF4444', glow: 'rgba(239,68,68,0.6)',   outer: 'rgba(239,68,68,0.2)'   },
  };
  const c = COLORS[status];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Glowing ball */}
      <div
        role="button" tabIndex={0} aria-label={label}
        onClick={() => onAsk?.('मेरे पैसे का हाल बताओ')}
        onKeyDown={e => { if (e.key === 'Enter') onAsk?.('मेरे पैसे का हाल बताओ'); }}
        style={{
          width: '200px', height: '200px', borderRadius: '50%',
          background: c.bg,
          boxShadow: `0 0 60px ${c.glow}, 0 0 120px ${c.outer}`,
          cursor: 'pointer', transition: 'all 0.8s ease',
          animation: 'tlPulse 2.5s ease-in-out infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '64px' }}>
          {status === 'green' ? '😊' : status === 'yellow' ? '😐' : '😟'}
        </span>
      </div>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
          {label}
        </div>
        <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)' }}>{sublabel}</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '8px' }}>
          Tap the circle to ask Vaani
        </div>
      </div>

      <style>{`
        @keyframes tlPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}

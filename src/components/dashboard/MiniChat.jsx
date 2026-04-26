import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

const MESSAGES = [
  { role: 'user', text: 'Mere paas ₹1.5 lakh hai. Kahan lagau?' },
  { role: 'assistant', text: 'Ramesh ji, 3 FD mein split karein — Suryoday, Jana, Utkarsh. Emergency fund ke liye ₹50K rakhein.' },
  { role: 'user', text: 'Beti ki shaadi October mein hai' },
  { role: 'assistant', text: 'Perfect! Sep FD ladder se Oct tak ₹14,200 ready hoga. Baaki ke liye RD shuru kar dete hain.' },
];

export default function MiniChat({ onOpenFull }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32, duration: 0.4, ease: 'easeOut' }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: 0 }}>VAANI AI Chat</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '2px 0 0' }}>वाणी से बात करें</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', background: '#10B981',
            boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
          }} />
          <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 600 }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '8px',
        maxHeight: '160px', overflowY: 'auto',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent',
      }}>
        {MESSAGES.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.40 + i * 0.06 }}
            style={{
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: '6px',
            }}
          >
            <div style={{
              maxWidth: '75%',
              background: msg.role === 'user' ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.06)',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              padding: '8px 12px',
              border: msg.role === 'user' ? '1px solid rgba(255,107,0,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}>
              <p style={{ color: '#fff', fontSize: '12px', margin: 0, lineHeight: 1.5 }}>{msg.text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input bar */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="VAANI se baat karein..."
          style={{
            flex: 1, height: '40px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '0 12px',
            color: '#fff', fontSize: '13px',
            outline: 'none', fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(255,107,0,0.5)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <button style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #FF6B00, #E55A00)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Send size={16} color="#fff" />
        </button>
      </div>

      <button
        onClick={onOpenFull}
        style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px', padding: '8px',
          color: 'rgba(255,255,255,0.5)', fontSize: '12px', cursor: 'pointer',
          fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,107,0,0.4)'; e.currentTarget.style.color = '#FF6B00'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
      >
        Open full chat →
      </button>
    </motion.div>
  );
}
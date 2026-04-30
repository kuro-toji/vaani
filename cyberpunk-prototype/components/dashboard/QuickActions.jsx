import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext.jsx';
import { useState, useEffect } from 'react';

export default function QuickActions({ compact = false }) {
  const navigate = useNavigate();
  
  // Get chat context - will throw if not in ChatProvider, so handle gracefully
  let chatContext = { sendMessage: null };
  try {
    chatContext = useChat() || { sendMessage: null };
  } catch (e) {
    // ChatContext not available
    chatContext = { sendMessage: null };
  }

  const sendMessage = chatContext?.sendMessage;
  const [clickedId, setClickedId] = useState(null);

  const actions = [
    {
      id: 'add-expense',
      emoji: '💸',
      label: 'Add Expense',
      color: 'var(--danger)',
      bg: 'rgba(239,68,68,0.12)',
      msg: 'I want to add an expense',
    },
    {
      id: 'add-fd',
      emoji: '🏦',
      label: 'Add FD',
      color: 'var(--accent)',
      bg: 'var(--accent-muted)',
      msg: 'I want to add an FD',
    },
    {
      id: 'add-sip',
      emoji: '📈',
      label: 'Add SIP',
      color: 'var(--success)',
      bg: 'rgba(16,185,129,0.12)',
      msg: 'I want to add a SIP',
    },
    {
      id: 'refresh-crypto',
      emoji: '₿',
      label: 'Crypto',
      color: 'var(--orange)',
      bg: 'rgba(255,107,0,0.12)',
      msg: 'Show my crypto holdings',
    },
  ];

  // Handler with full error handling
  const handleAction = (action) => {
    if (clickedId !== null) return; // Prevent double clicks
    
    // Show visual feedback
    setClickedId(action.id);
    console.log('[QuickActions] Button clicked:', action.label, '| Message:', action.msg);
    
    try {
      // Always navigate to app/chat first
      navigate('/app?tab=chat');
      
      // Try to send message if available
      if (sendMessage) {
        // Use setTimeout to ensure we're outside React's render phase
        setTimeout(async () => {
          try {
            await sendMessage(action.msg);
            console.log('[QuickActions] Message sent successfully');
          } catch (err) {
            console.log('[QuickActions] Could not send message (chat may not be connected). Say: "' + action.msg + '"');
          }
        }, 100);
      } else {
        console.log('[QuickActions] Chat not available. Would send: "' + action.msg + '"');
      }
    } catch (error) {
      console.error('[QuickActions] Navigation error:', error.message);
    }
    
    // Clear visual feedback
    setTimeout(() => setClickedId(null), 300);
  };

  return (
    <div className={`card ${compact ? '' : ''}`}>
      <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        {actions.map(action => {
          const isClicked = clickedId === action.id;
          return (
            <button
              key={action.id}
              type="button"
              className="flex items-center gap-2 p-3 rounded-lg hover-lift"
              disabled={isClicked}
              onClick={() => handleAction(action)}
              style={{
                background: action.bg,
                border: '1px solid var(--border-subtle)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                pointerEvents: 'auto',
                opacity: isClicked ? 0.7 : 1,
                transform: isClicked ? 'scale(0.97)' : 'scale(1)',
              }}
              onMouseEnter={e => {
                if (!isClicked) e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = action.color;
              }}
              onMouseLeave={e => {
                if (!isClicked) e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <span style={{ fontSize: '18px' }}>{action.emoji}</span>
              <span className="text-xs font-medium" style={{ color: action.color }}>
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
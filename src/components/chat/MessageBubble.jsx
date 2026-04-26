import { motion } from 'framer-motion';
import { FDActionCard, GoalCard, WarningCard } from './InlineActionCard';

export default function ChatBubble({ message, isStreaming }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.34, 1.2, 0.64, 1] }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: '8px',
        marginBottom: '12px',
        maxWidth: '70%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      {/* Avatar */}
      {!isUser && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B00, #E55A00)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 800, color: '#fff', flexShrink: 0,
          boxShadow: '0 0 0 2px rgba(255,107,0,0.2)',
        }}>V</div>
      )}

      {/* Bubble */}
      <div>
        <div
          style={{
            background: isUser ? '#FF6B00' : '#0F2E2B',
            border: isUser ? 'none' : '1px solid rgba(255,107,0,0.2)',
            borderLeft: isUser ? 'none' : '2px solid #FF6B00',
            borderRadius: isUser
              ? '18px 4px 18px 18px'
              : '4px 18px 18px 18px',
            padding: '10px 14px',
            maxWidth: '100%',
          }}
        >
          <p style={{
            color: '#fff',
            fontSize: '14px',
            lineHeight: 1.6,
            margin: 0,
            fontFamily: '"Noto Sans Devanagari", system-ui, sans-serif',
            wordBreak: 'break-word',
          }}>
            {message.content}
            {isStreaming && <span style={{ opacity: 0.7 }}>&#9646;</span>}
          </p>
        </div>

        {/* Inline action cards */}
        {!isUser && message.actionCard && (
          <div style={{ marginTop: '4px' }}>
            {message.actionCard.type === 'fd' && (
              <FDActionCard {...message.actionCard} onAction={message.actionCard.onAction} />
            )}
            {message.actionCard.type === 'goal' && (
              <GoalCard {...message.actionCard} onAction={message.actionCard.onAction} />
            )}
            {message.actionCard.type === 'warning' && (
              <WarningCard message={message.actionCard.message} />
            )}
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <p style={{
            color: 'rgba(255,255,255,0.25)',
            fontSize: '10px',
            margin: '3px 4px 0',
            textAlign: isUser ? 'right' : 'left',
          }}>
            {new Date(message.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </p>
        )}
      </div>

      {isUser && (
        <div style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>U</div>
      )}
    </motion.div>
  );
}
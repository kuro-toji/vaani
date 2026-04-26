/**
 * MessageBubble — Premium chat message bubble with smooth animations.
 * @param {Object} props
 * @param {Object} props.message - Message object with { id, role, content, timestamp }
 * @param {string} props.language - Language code for potential i18n
 */
function MessageBubble({ message, language }) {
  const isUser = message.role === 'user';
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const parseContent = (content) => {
    if (!content) return [];
    const paragraphs = content.split('\n');
    
    return paragraphs.map((paragraph, pIndex) => {
      const parts = paragraph.split(/(\*\*.*?\*\*)/g);
      
      return (
        <span key={pIndex}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
          {pIndex < paragraphs.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      animation: 'messageSlideIn 0.3s ease forwards',
      opacity: 0,
    }}>
      {/* Avatar for AI */}
      {!isUser && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #0F6E56, #10B981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', color: 'white', flexShrink: 0,
          marginRight: '8px', marginTop: '4px',
          boxShadow: '0 2px 8px rgba(15, 110, 86, 0.3)',
        }}>🔊</div>
      )}

      <div 
        dir="auto" 
        role="region"
        aria-label={isUser ? 'आपका संदेश' : 'Vaani का जवाब'}
        style={{
          maxWidth: isUser ? '75%' : '80%',
          padding: 'var(--vaani-bubble-padding, 12px) 16px',
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          backgroundColor: isUser ? 'var(--vaani-user-bubble)' : 'var(--vaani-ai-bubble-bg)',
          color: isUser ? 'white' : 'var(--vaani-ai-bubble-text)',
          border: isUser ? 'none' : '1px solid var(--vaani-border)',
          boxShadow: isUser
            ? '0 2px 12px rgba(15, 110, 86, 0.25)'
            : '0 1px 4px rgba(0, 0, 0, 0.06)',
          lineHeight: 1.6,
          fontSize: 'var(--vaani-base-font-size, 15px)',
        }}
      >
        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
          {parseContent(message.content)}
        </p>
        <span 
          style={{
            fontSize: '11px',
            color: isUser ? 'rgba(255,255,255,0.6)' : '#9CA3AF',
            marginTop: '4px',
            display: 'block',
          }}
          aria-label={formatTime(message.timestamp)}
        >
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* Avatar for User */}
      {isUser && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', color: 'white', flexShrink: 0,
          marginLeft: '8px', marginTop: '4px',
          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
        }}>👤</div>
      )}

      <style>{`
        @keyframes messageSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default MessageBubble;
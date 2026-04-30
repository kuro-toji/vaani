import { useCallback } from 'react';

/**
 * MessageBubble — WhatsApp-style chat bubble.
 * User: right-aligned, primary green, no border.
 * AI: left-aligned, glass surface, with backdrop blur.
 */
function parseMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: '4px 0', paddingLeft: '20px', listStyleType: 'disc' }}>
          {listBuffer.map((item, i) => (
            <li key={i} style={{ margin: '2px 0', color: 'inherit' }}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) { flushList(); elements.push(<br key={`br-${i}`} />); continue; }
    const bulletMatch = line.match(/^[-•]\s+(.*)/);
    if (bulletMatch) { listBuffer.push(bulletMatch[1]); continue; }
    flushList();
    elements.push(<p key={`p-${i}`} style={{ margin: '2px 0' }}>{parseInline(line)}</p>);
  }
  flushList();
  return elements;
}

function parseInline(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return ''; }
}

export default function MessageBubble({ message, language }) {
  const isUser = message.role === 'user';

  const handleSpeak = useCallback(() => {
    if (isUser) return;
    if (!('speechSynthesis' in window)) return;
    const bcp47 = {
      hi: 'hi-IN', en: 'en-IN', bn: 'bn-IN', te: 'te-IN',
      ta: 'ta-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN',
    };
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = bcp47[language] || 'hi-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [message.content, language, isUser]);

  return (
    <div
      role="listitem"
      className="flex flex-col"
      style={{
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
        animation: 'msgSlideIn 0.3s var(--ease-spring) both',
      }}
    >
      <div className="flex items-end gap-2" style={{ maxWidth: '85%' }}>
        {/* AI avatar */}
        {!isUser && (
          <div
            className="flex-shrink-0 mb-1"
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}
          >
            V
          </div>
        )}

        {/* Bubble */}
        <div
          dir="auto"
          className={isUser ? 'bubble-user' : 'bubble-ai'}
          style={{
            padding: '12px 16px',
            borderRadius: isUser
              ? '18px 18px 4px 18px'
              : '18px 18px 18px 4px',
            background: isUser
              ? 'var(--primary)'
              : 'var(--glass-bg)',
            backdropFilter: isUser ? 'none' : 'blur(16px)',
            border: isUser ? 'none' : '1px solid var(--glass-border)',
            color: '#fff',
            fontSize: '14px',
            lineHeight: 1.6,
            wordBreak: 'break-word',
            boxShadow: isUser
              ? '0 4px 14px rgba(29,158,117,0.25)'
              : '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ wordBreak: 'break-word' }}>
            {parseMarkdown(message.content)}
          </div>
        </div>

        {/* User avatar */}
        {isUser && (
          <div
            className="flex-shrink-0 mb-1"
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}
          >
            U
          </div>
        )}
      </div>

      {/* Timestamp + speak button row */}
      <div
        className="flex items-center gap-2"
        style={{
          marginTop: '3px',
          marginLeft: isUser ? 0 : '36px',
          marginRight: isUser ? '36px' : 0,
        }}
      >
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {formatTime(message.timestamp)}
        </span>

        {/* Speak button — only for AI messages */}
        {!isUser && (
          <button
            onClick={handleSpeak}
            aria-label="Listen to this message"
            className="flex items-center justify-center"
            style={{
              width: '22px', height: '22px', borderRadius: '50%',
              border: 'none', background: 'transparent',
              cursor: 'pointer', color: 'var(--text-tertiary)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
import { useState, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';

/**
 * Parse simple markdown into React elements.
 * Handles: **bold**, *italic*, \n line breaks, - or • bullet lists.
 * No external library needed.
 */
function parseMarkdown(text) {
  if (!text) return [null];

  const lines = text.split('\n');
  const elements = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: '4px 0', paddingLeft: '20px', listStyleType: 'disc' }}>
          {listBuffer.map((item, i) => (
            <li key={i} style={{ margin: '2px 0' }}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Empty line → spacer
    if (line === '') {
      flushList();
      elements.push(<br key={`br-${i}`} />);
      continue;
    }

    // Bullet line: starts with - or • or *  (but not *italic*)
    const bulletMatch = line.match(/^[-•]\s+(.*)/);
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} style={{ margin: '2px 0' }}>{parseInline(line)}</p>
    );
  }

  flushList();
  return elements;
}

/**
 * Parse inline markdown: **bold** and *italic*
 */
function parseInline(text) {
  if (!text) return null;

  // Split on **bold** and *italic* patterns
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

/**
 * Safe timestamp parser — handles string dates from localStorage.
 */
function safeFormatTime(timestamp) {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

/**
 * MessageBubble — Chat message bubble with markdown rendering and accessibility.
 */
function MessageBubble({ message, language }) {
  const isUser = message.role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { largeText } = useAccessibility();

  const handleSpeak = useCallback(async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      // Use global vaaniSpeak (exposed by App.jsx) or fallback to browser TTS
      if (typeof window.vaaniSpeak === 'function') {
        await window.vaaniSpeak(message.content, language);
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.lang = language === 'hi' ? 'hi-IN' : language;
        utterance.rate = 0.9;
        await new Promise(resolve => {
          utterance.onend = resolve;
          utterance.onerror = resolve;
          window.speechSynthesis.speak(utterance);
        });
      }
    } finally {
      setIsSpeaking(false);
    }
  }, [message.content, language, isSpeaking]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSpeak();
    }
  };

  const ariaLabel = isUser
    ? `आपने कहा: ${message.content.substring(0, 100)}`
    : `Vaani का जवाब: ${message.content.substring(0, 100)}`;

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
        role="article"
        tabIndex={0}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        className="message-bubble"
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
          fontSize: largeText ? '20px' : 'var(--vaani-base-font-size, 15px)',
          outline: 'none',
          position: 'relative',
        }}
      >
        {/* Rendered markdown content */}
        <div style={{ wordBreak: 'break-word' }}>
          {parseMarkdown(message.content)}
        </div>

        {/* Footer row: timestamp + speaker button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '4px',
          gap: '8px',
        }}>
          <span style={{
            fontSize: '11px',
            color: isUser ? 'rgba(255,255,255,0.6)' : '#9CA3AF',
          }}>
            {safeFormatTime(message.timestamp)}
          </span>

          {/* Speaker icon — AI messages only, hover on desktop, always on mobile */}
          {!isUser && (
            <button
              onClick={(e) => { e.stopPropagation(); handleSpeak(); }}
              disabled={isSpeaking}
              aria-label="यह संदेश सुनें"
              title="सुनें"
              className="speak-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                background: isSpeaking ? 'rgba(15, 110, 86, 0.2)' : 'transparent',
                cursor: isSpeaking ? 'default' : 'pointer',
                padding: 0,
                transition: 'all 0.2s ease',
                opacity: isSpeaking ? 0.8 : undefined,
                flexShrink: 0,
              }}
            >
              <Volume2 size={14} color="var(--vaani-primary, #0F6E56)" />
            </button>
          )}
        </div>
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
        /* Desktop: speaker button hidden until bubble hover */
        .message-bubble .speak-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .message-bubble:hover .speak-btn,
        .message-bubble:focus-within .speak-btn {
          opacity: 0.7;
        }
        .message-bubble .speak-btn:hover {
          opacity: 1 !important;
          background: rgba(15, 110, 86, 0.15) !important;
        }
        /* Mobile / touch: speaker always visible */
        @media (pointer: coarse) {
          .message-bubble .speak-btn {
            opacity: 0.7 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MessageBubble;
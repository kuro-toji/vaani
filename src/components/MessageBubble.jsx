import { useState, useCallback } from 'react';
import { Volume2 } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext.jsx';

/**
 * Parse simple markdown into React elements.
 * Handles: **bold**, *italic*, \n line breaks, - or • bullet lists.
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

    if (line === '') {
      flushList();
      elements.push(<br key={`br-${i}`} />);
      continue;
    }

    const bulletMatch = line.match(/^[-•]\s+(.*)/);
    if (bulletMatch) {
      listBuffer.push(bulletMatch[1]);
      continue;
    }

    flushList();
    elements.push(
      <p key={`p-${i}`} style={{ margin: '2px 0' }}>{parseInline(line)}</p>
    );
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
 * MessageBubble — iMessage-style chat bubble.
 */
function MessageBubble({ message, language }) {
  const isUser = message.role === 'user';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { largeText, highContrast } = useAccessibility();

  const handleSpeak = useCallback(async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
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
    <div role="listitem" style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '8px',
      marginBottom: '12px',
      animation: 'msgSlideIn 0.3s cubic-bezier(0.34, 1.3, 0.64, 1) both',
      animationFillMode: 'both',
    }}>
      {/* Avatar — AI (left) */}
      {!isUser && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #0F6E56, #00D4AA)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: 'white',
          flexShrink: 0, marginRight: '8px', marginTop: '4px',
          boxShadow: '0 2px 8px rgba(15, 110, 86, 0.3)',
          ...(highContrast && { background: '#FFFFFF', border: '2px solid #00FF88', color: '#00FF88' }),
        }}>V</div>
      )}

      {/* Message column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {/* Bubble */}
        <div
          dir="auto"
          role="article"
          tabIndex={0}
          aria-label={ariaLabel}
          onKeyDown={handleKeyDown}
          className={isUser ? 'bubble-user' : 'bubble-ai'}
          style={{
            maxWidth: '72%',
            padding: isUser ? '10px 16px' : '12px 16px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser
              ? 'linear-gradient(135deg, #0F6E56, #1D9E75)'
              : 'rgba(255,255,255,0.07)',
            backdropFilter: isUser ? 'none' : 'blur(12px)',
            WebkitBackdropFilter: isUser ? 'none' : 'blur(12px)',
            border: isUser ? 'none' : '1px solid rgba(255,255,255,0.1)',
            color: '#ffffff',
            fontSize: largeText ? '18px' : '15px',
            lineHeight: 1.55,
            letterSpacing: '0.1px',
            wordBreak: 'break-word',
            boxShadow: isUser
              ? '0 2px 12px rgba(16,185,129,0.25)'
              : '0 2px 8px rgba(0,0,0,0.3)',
            // High-contrast override
            ...(highContrast && {
              background: isUser ? '#004400' : '#FFFFFF',
              border: isUser ? '2px solid #00FF88' : '2px solid #000000',
              color: isUser ? '#FFFFFF' : '#000000',
              boxShadow: 'none',
            }),
          }}
        >
          {/* Rendered markdown content */}
          <div style={{ wordBreak: 'break-word' }}>
            {parseMarkdown(message.content)}
          </div>
        </div>

        {/* Timestamp — below bubble, outside */}
        <span style={{
          fontSize: '11px',
          color: '#8E8E93',
          marginTop: '3px',
          marginLeft: isUser ? 0 : '4px',
          marginRight: isUser ? '4px' : 0,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {safeFormatTime(message.timestamp)}
        </span>

        {/* Speak button — below AI bubble, right-aligned, ghost style */}
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
              background: 'transparent',
              cursor: isSpeaking ? 'default' : 'pointer',
              padding: 0,
              transition: 'all 0.2s ease',
              marginTop: '2px',
              marginLeft: isUser ? 0 : '4px',
              marginRight: isUser ? '4px' : 0,
              alignSelf: isUser ? 'flex-end' : 'flex-start',
              opacity: isSpeaking ? 0.8 : 0.6,
            }}
          >
            <Volume2 size={14} color="#0F6E56" />
          </button>
        )}
      </div>

      {/* Avatar — User (right) */}
      {isUser && (
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: 'white',
          flexShrink: 0, marginLeft: '8px', marginTop: '4px',
          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
          ...(highContrast && { background: '#FFFFFF', border: '2px solid #6366F1', color: '#6366F1' }),
        }}>U</div>
      )}

      <style>{`
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        /* Bubble tails */
        .bubble-user {
          position: relative;
          overflow: visible;
        }
        .bubble-user::after {
          content: '';
          position: absolute;
          bottom: 0;
          right: -6px;
          width: 12px;
          height: 12px;
          background: #1D9E75;
          clip-path: polygon(0 0, 0% 100%, 100% 100%);
        }
        .bubble-ai {
          position: relative;
          overflow: visible;
        }
        .bubble-ai::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: -6px;
          width: 12px;
          height: 12px;
          background: rgba(255,255,255,0.07);
          clip-path: polygon(100% 0, 0% 100%, 100% 100%);
        }
        /* Desktop: speak button hidden until bubble hover */
        .speak-btn {
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .bubble-ai:hover .speak-btn {
          opacity: 0.6;
        }
        .bubble-ai .speak-btn:hover {
          opacity: 1 !important;
          background: rgba(15, 110, 86, 0.1) !important;
        }
        /* Mobile / touch: speak button always visible */
        @media (pointer: coarse) {
          .speak-btn {
            opacity: 0.6 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MessageBubble;

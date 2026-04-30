import { useEffect, useState } from 'react';

/**
 * StreamingText — shows AI response word-by-word as it arrives.
 * Appears as an AI bubble that grows as tokens stream in.
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
          {listBuffer.map((item, i) => <li key={i} style={{ margin: '2px 0' }}>{item}</li>)}
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
    elements.push(<p key={`p-${i}`} style={{ margin: '2px 0' }}>{line}</p>);
  }
  flushList();
  return elements;
}

export default function StreamingText({ text, language }) {
  const [visibleText, setVisibleText] = useState('');
  const [cursor, setCursor] = useState(true);

  // Reveal text gradually — one character at a time for smooth animation
  useEffect(() => {
    if (!text) { setVisibleText(''); return; }
    setVisibleText(text);
  }, [text]);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setCursor(c => !c), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      role="listitem"
      className="flex items-end gap-2 mb-12"
      style={{ animation: 'msgSlideIn 0.3s var(--ease-spring) both' }}
    >
      {/* AI avatar */}
      <div
        style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--accent))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0,
        }}
      >
        V
      </div>

      {/* Bubble with streaming text */}
      <div
        className="bubble-ai"
        style={{
          padding: '12px 16px',
          borderRadius: '18px 18px 18px 4px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          color: '#fff',
          fontSize: '14px',
          lineHeight: 1.6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          maxWidth: '85%',
          minWidth: '60px',
        }}
      >
        <div style={{ wordBreak: 'break-word' }}>
          {parseMarkdown(visibleText)}
          <span
            style={{
              display: 'inline-block',
              width: '2px',
              height: '14px',
              background: 'var(--primary)',
              marginLeft: '2px',
              verticalAlign: 'text-bottom',
              opacity: cursor ? 1 : 0,
              transition: 'opacity 0.1s',
            }}
          />
        </div>
      </div>
    </div>
  );
}
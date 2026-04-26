/**
 * TypingIndicator — three bouncing dots in a bubble.
 * Used when AI is "thinking" but not yet streaming.
 */
export default function TypingIndicator() {
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

      {/* Typing bubble */}
      <div
        className="bubble-ai"
        style={{
          padding: '14px 18px',
          borderRadius: '18px 18px 18px 4px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--text-tertiary)',
              display: 'inline-block',
              animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
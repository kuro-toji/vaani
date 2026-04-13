export function LoadingSpinner({ size = 24, color = 'var(--vaani-primary)' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 1s linear infinite' }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="0"
      />
    </svg>
  );
}

export function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--vaani-primary)',
            animation: 'bounce 1.4s infinite ease-in-out both',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export function LoadingPulse() {
  return (
    <div
      style={{
        width: '100%',
        height: '20px',
        backgroundColor: 'var(--vaani-bg-secondary)',
        borderRadius: 'var(--vaani-radius)',
        animation: 'pulse 2s infinite',
      }}
    />
  );
}

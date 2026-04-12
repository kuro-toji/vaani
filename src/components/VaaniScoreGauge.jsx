/**
 * VaaniScoreGauge — Animated circular gauge showing financial health score.
 * Pure SVG, no dependencies.
 */
export default function VaaniScoreGauge({ score = 0, level = 'unknown', emoji = '❓', size = 120 }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  const colorMap = {
    excellent: '#10B981',
    good: '#F59E0B',
    fair: '#F97316',
    'needs-work': '#EF4444',
    unknown: '#9CA3AF',
  };

  const strokeColor = colorMap[level] || colorMap.unknown;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease' }}
          />
        </svg>
        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: size * 0.28, fontWeight: 800, color: strokeColor }}>
            {score}
          </span>
          <span style={{ fontSize: size * 0.12, color: '#6B7280' }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: strokeColor }}>{emoji} VAANI Score</span>
      </div>
    </div>
  );
}

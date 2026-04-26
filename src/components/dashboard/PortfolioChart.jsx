import { useEffect, useRef } from 'react';

const COLORS = {
  fd: '#6366F1',
  sip: '#10B981',
  crypto: '#FF6B00',
};

const LABELS = {
  fd: 'Fixed Deposits',
  sip: 'SIP',
  crypto: 'Crypto',
};

function polarToCartesian(cx, cy, r, angle) {
  const rad = (angle - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function PortfolioChart({ fd, sip, crypto }) {
  const canvasRef = useRef(null);
  const total = fd + sip + crypto;

  const segments = [
    { label: 'fd', value: fd, color: COLORS.fd },
    { label: 'sip', value: sip, color: COLORS.sip },
    { label: 'crypto', value: crypto, color: COLORS.crypto },
  ].filter(s => s.value > 0);

  // SVG donut chart
  if (total === 0) {
    return (
      <div className="card">
        <h3 className="font-semibold text-sm mb-4">Allocation</h3>
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No assets yet</p>
        </div>
      </div>
    );
  }

  const cx = 80, cy = 80, r = 60, thickness = 20;
  let currentAngle = 0;

  return (
    <div className="card">
      <h3 className="font-semibold text-sm mb-4">Allocation</h3>

      <div className="flex items-center gap-6">
        {/* Donut SVG */}
        <div style={{ flexShrink: 0 }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={thickness} />
            {/* Segments */}
            {segments.map((seg, i) => {
              const pct = seg.value / total;
              const angle = pct * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;

              if (pct < 0.01) return null;

              const path = describeArc(cx, cy, r, startAngle, endAngle);

              return (
                <circle
                  key={seg.label}
                  r={r}
                  cx={cx}
                  cy={cy}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${describeArc(cx, cy, r, startAngle, endAngle)}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.8s var(--ease-smooth)' }}
                />
              );
            })}
            {/* Center text */}
            <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="700">
              ₹{(total / 100000).toFixed(1)}L
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">
              Total
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3">
          {segments.map((seg) => {
            const pct = ((seg.value / total) * 100).toFixed(1);
            return (
              <div key={seg.label} className="flex items-center gap-2">
                <div
                  style={{
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: seg.color, flexShrink: 0,
                  }}
                />
                <div className="flex-1">
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    {LABELS[seg.label]}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    ₹{seg.value.toLocaleString('en-IN')} ({pct}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
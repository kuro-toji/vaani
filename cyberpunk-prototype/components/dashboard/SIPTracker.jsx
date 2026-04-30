export default function SIPTracker({ sips }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">SIP Holdings</h3>
        <span className="badge badge-success text-xs">{sips.length} active</span>
      </div>

      <div className="flex flex-col gap-3">
        {sips.map((sip, i) => (
          <div
            key={sip.id || i}
            className="flex items-center justify-between p-3 rounded-lg"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--border-subtle)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: '40px', height: '40px',
                  background: 'rgba(16,185,129,0.15)',
                  color: 'var(--success)',
                  fontSize: '18px',
                }}
              >
                📈
              </div>
              <div>
                <div className="font-semibold text-sm">{sip.institution || 'SIP Fund'}</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  ₹{parseFloat(sip.principal || 0).toLocaleString('en-IN')}/mo
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                ₹{parseFloat(sip.current_value || sip.principal || 0).toLocaleString('en-IN')}
              </div>
              <div className="flex items-center justify-end gap-1 mt-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                </svg>
                <span className="text-xs font-medium" style={{ color: 'var(--success)' }}>
                  {sip.interest_rate ? `${sip.interest_rate}%` : '+8.2%'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
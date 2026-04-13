export function Skeleton({ width = '100%', height = '20px', borderRadius = 'var(--vaani-radius)' }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, lastLineWidth = '60%' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          height="16px"
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 'var(--vaani-space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--vaani-space-3)', marginBottom: 'var(--vaani-space-4)' }}>
        <Skeleton width="48px" height="48px" borderRadius="var(--vaani-radius-full)" />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height="16px" />
          <div style={{ height: '8px' }} />
          <Skeleton width="40%" height="12px" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonMessage() {
  return (
    <div style={{ display: 'flex', gap: 'var(--vaani-space-3)', marginBottom: 'var(--vaani-space-4)' }}>
      <Skeleton width="36px" height="36px" borderRadius="var(--vaani-radius-full)" />
      <div style={{ flex: 1 }}>
        <Skeleton width="80%" height="48px" borderRadius="var(--vaani-radius-lg)" />
      </div>
    </div>
  );
}

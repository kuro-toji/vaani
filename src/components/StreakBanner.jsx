import { getStreak, getStreakMessage } from '../services/streakService.js';

/**
 * StreakBanner — Shows current savings/usage streak with motivational message.
 */
export default function StreakBanner() {
  const streak = getStreak();

  if (!streak || streak.currentStreak === 0) return null;

  const message = getStreakMessage(streak.currentStreak);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 16px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(239, 68, 68, 0.05))',
        borderRadius: '12px',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        fontSize: '14px',
      }}
      role="status"
      aria-label={`${streak.currentStreak} day streak`}
    >
      <span style={{ fontSize: '20px' }}>🔥</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 700, color: '#D97706' }}>
          {streak.currentStreak} दिन
        </span>
        <span style={{ color: '#92400E', marginLeft: '6px' }}>
          {message}
        </span>
      </div>
      {streak.longestStreak > streak.currentStreak && (
        <span style={{ fontSize: '12px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
          Best: {streak.longestStreak}
        </span>
      )}
    </div>
  );
}

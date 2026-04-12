/**
 * Streak Service — Tracks daily usage/savings streaks for gamification.
 * Data persisted in localStorage for speed, synced to IndexedDB as backup.
 */

const STREAK_KEY = 'vaani_streak';

function getToday() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function daysBetween(d1, d2) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
}

function loadStreak() {
  try {
    const data = localStorage.getItem(STREAK_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveStreak(data) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save streak:', e);
  }
}

/**
 * Record today's activity. Returns updated streak data.
 */
export function recordActivity() {
  const today = getToday();
  const existing = loadStreak();

  if (!existing) {
    const fresh = {
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      totalDays: 1,
      startDate: today,
      milestones: ['1'],
    };
    saveStreak(fresh);
    return fresh;
  }

  // Already recorded today
  if (existing.lastActiveDate === today) {
    return existing;
  }

  const gap = daysBetween(existing.lastActiveDate, today);

  let updated;
  if (gap === 1) {
    // Consecutive day — extend streak
    const newStreak = existing.currentStreak + 1;
    updated = {
      ...existing,
      currentStreak: newStreak,
      longestStreak: Math.max(existing.longestStreak, newStreak),
      lastActiveDate: today,
      totalDays: existing.totalDays + 1,
      milestones: existing.milestones || [],
    };
    // Check milestones
    const milestoneValues = [7, 14, 30, 50, 100, 365];
    for (const m of milestoneValues) {
      if (newStreak === m && !updated.milestones.includes(String(m))) {
        updated.milestones.push(String(m));
      }
    }
  } else {
    // Streak broken — reset
    updated = {
      ...existing,
      currentStreak: 1,
      lastActiveDate: today,
      totalDays: existing.totalDays + 1,
    };
  }

  saveStreak(updated);
  return updated;
}

/**
 * Get current streak data without modifying it.
 */
export function getStreak() {
  return loadStreak() || {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    totalDays: 0,
    startDate: null,
    milestones: [],
  };
}

/**
 * Get a motivational message based on the streak length.
 */
export function getStreakMessage(streak) {
  if (streak >= 100) return 'शानदार! 100+ दिन! 🏆 आप वित्तीय विशेषज्ञ बन गए!';
  if (streak >= 30) return 'एक महीना पूरा! 🎉 आपकी आदत बन गई!';
  if (streak >= 14) return 'दो हफ्ते! 💪 आप लगातार आगे बढ़ रहे हैं!';
  if (streak >= 7) return 'एक हफ्ता! 🔥 बहुत बढ़िया!';
  if (streak >= 3) return 'तीन दिन लगातार! ⭐ अच्छी शुरुआत!';
  if (streak >= 1) return 'आज का दिन शुरू! 🌱';
  return 'आज VAANI से बात करके शुरू करें!';
}

export default { recordActivity, getStreak, getStreakMessage };

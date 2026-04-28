// ═══════════════════════════════════════════════════════════════════
// VAANI Push Notification Service
// FD maturity, Budget alerts, Milestones, Weekly summaries
// ═══════════════════════════════════════════════════════════════════

import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Notification Channel IDs ─────────────────────────────────────────
const CHANNEL_FD = 'fd-maturity';
const CHANNEL_BUDGET = 'budget-alerts';
const CHANNEL_MILESTONE = 'milestones';
const CHANNEL_WEEKLY = 'weekly-summary';
const CHANNEL_REMINDER = 'reminders';

// ─── Notification Types ───────────────────────────────────────────────
export type NotificationType = 'fd_maturity' | 'budget_warning' | 'budget_exceeded' | 'savings_milestone' | 'weekly_summary' | 'reminder';

export interface NotificationConfig {
  fdMaturityDays: number;        // Days before maturity to notify
  budgetWarningPercent: number;  // % of budget to trigger warning
  enableHaptic: boolean;
  quietHours: { start: string; end: string }; // "22:00", "07:00"
  weeklySummaryDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  weeklySummaryTime: string;    // "09:00"
}

// ─── Default Config ───────────────────────────────────────────────────
const DEFAULT_CONFIG: NotificationConfig = {
  fdMaturityDays: 7,
  budgetWarningPercent: 80,
  enableHaptic: true,
  quietHours: { start: '22:00', end: '07:00' },
  weeklySummaryDay: 'sunday',
  weeklySummaryTime: '09:00',
};

// ─── FD Maturity Notifications ──────────────────────────────────────
export interface FDMaturityAlert {
  id: string;
  bank: string;
  amount: number;
  maturityDate: string;
  daysUntilMaturity: number;
}

// ─── Budget Alerts ────────────────────────────────────────────────────
export interface BudgetAlert {
  id: string;
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  alertType: 'warning' | 'exceeded';
}

// ─── Savings Milestones ──────────────────────────────────────────────
export interface MilestoneAlert {
  id: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  milestone: number; // 25, 50, 75, 100
}

// ─── Initialize Notifications ────────────────────────────────────────
export async function initializeNotifications(): Promise<void> {
  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted');
      return;
    }

    // Set up notification categories
    await Notifications.setNotificationCategoryAsync('finance', [
      { id: 'view', title: 'View', options: { opensApp: true } },
      { id: 'dismiss', title: 'Dismiss', options: { opensApp: false } },
    ]);

    // Set up notification handlers
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    console.log('[Notifications] Initialized');
  } catch (error) {
    console.error('[Notifications] Init error:', error);
  }
}

// ─── Schedule FD Maturity Alert ──────────────────────────────────────
export async function scheduleFDMaturityAlert(alert: FDMaturityAlert): Promise<string> {
  const { id, bank, amount, maturityDate, daysUntilMaturity } = alert;

  // Calculate notification date
  const maturity = new Date(maturityDate);
  const notifyDate = new Date(maturity);
  notifyDate.setDate(notifyDate.getDate() - 7); // 7 days before

  // If date has passed, schedule for next occurrence
  if (notifyDate < new Date()) {
    notifyDate.setFullYear(notifyDate.getFullYear() + 1);
  }

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏦 FD मैच्योरिटी',
      titleLocalizations: {
        'hi': '🏦 FD मैच्योरिटी',
        'en': '🏦 FD Maturity Alert',
      },
      body: `${bank}: ₹${amount.toLocaleString('en-IN')} matures in ${daysUntilMaturity} days`,
      bodyLocalizations: {
        'hi': `${bank}: ₹${amount.toLocaleString('hi-IN')} ${daysUntilMaturity} दिनों में मैच्योर होगा`,
        'en': `${bank}: ₹${amount.toLocaleString('en-IN')} matures in ${daysUntilMaturity} days`,
      },
      data: { type: 'fd_maturity', id, amount, bank },
      categoryIdentifier: 'finance',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notifyDate,
    },
  });

  return identifier;
}

// ─── Schedule Budget Warning ──────────────────────────────────────────
export async function scheduleBudgetAlert(alert: BudgetAlert): Promise<string> {
  const { id, category, spent, limit, percentage } = alert;
  const remaining = limit - spent;
  const isExceeded = spent > limit;

  const categoryLabels: Record<string, string> = {
    food: 'खाना',
    transport: 'यातायात',
    utilities: 'बिल',
    entertainment: 'मनोरंजन',
    health: 'स्वास्थ्य',
    shopping: 'खरीदारी',
    rent: 'किराया',
    other: 'अन्य',
  };

  const categoryName = categoryLabels[category] || category;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: isExceeded ? '⚠️ बजट पार!' : '💰 बजट अलर्ट',
      titleLocalizations: {
        'hi': isExceeded ? '⚠️ बजट पार!' : '💰 बजट अलर्ट',
        'en': isExceeded ? '⚠️ Budget Exceeded!' : '💰 Budget Alert',
      },
      body: `${categoryName}: ${percentage}% spent. ${isExceeded ? 'Limit cross!' : `₹${remaining.toLocaleString('en-IN')} remaining`}`,
      bodyLocalizations: {
        'hi': `${categoryName}: ${percentage}% खर्च। ${isExceeded ? 'सीमा पार!' : `₹${remaining.toLocaleString('hi-IN')} बचा`}`,
        'en': `${categoryName}: ${percentage}% spent. ${isExceeded ? 'Limit crossed!' : `₹${remaining.toLocaleString('en-IN')} remaining`}`,
      },
      data: { type: 'budget', id, category, spent, limit },
      categoryIdentifier: 'finance',
    },
    trigger: null, // Immediate
  });

  // Haptic feedback
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}

  return identifier;
}

// ─── Schedule Milestone Alert ────────────────────────────────────────
export async function scheduleMilestoneAlert(alert: MilestoneAlert): Promise<string> {
  const { id, goalName, targetAmount, currentAmount, progress, milestone } = alert;

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎉 ${milestone}% माइलस्टोन!`,
      titleLocalizations: {
        'hi': `🎉 ${milestone}% माइलस्टोन!`,
        'en': `🎉 ${milestone}% Milestone!`,
      },
      body: `${goalName}: ₹${currentAmount.toLocaleString('en-IN')} saved. ${progress}% progress!`,
      bodyLocalizations: {
        'hi': `${goalName}: ₹${currentAmount.toLocaleString('hi-IN')} बचाया। ${progress}% पूरा!`,
        'en': `${goalName}: ₹${currentAmount.toLocaleString('en-IN')} saved. ${progress}% complete!`,
      },
      data: { type: 'milestone', id, goalName, progress, milestone },
      categoryIdentifier: 'finance',
    },
    trigger: null, // Immediate
  });

  // Success haptic
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}

  return identifier;
}

// ─── Schedule Weekly Summary ──────────────────────────────────────────
export async function scheduleWeeklySummary(
  totalSpent: number,
  totalBudget: number,
  topCategories: Array<{ category: string; amount: number }>
): Promise<string> {
  const savings = totalBudget - totalSpent;
  const savingsPercent = totalBudget > 0 ? ((savings / totalBudget) * 100).toFixed(0) : 0;

  const topCategoryText = topCategories.length > 0 
    ? `\nTop: ${topCategories[0].category} ₹${topCategories[0].amount.toLocaleString('en-IN')}`
    : '';

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 साप्ताहिक सारांश',
      titleLocalizations: {
        'hi': '📊 साप्ताहिक सारांश',
        'en': '📊 Weekly Summary',
      },
      body: `Spent: ₹${totalSpent.toLocaleString('en-IN')} | Saved: ${savingsPercent}%${topCategoryText}`,
      bodyLocalizations: {
        'hi': `खर्च: ₹${totalSpent.toLocaleString('hi-IN')} | बचत: ${savingsPercent}%${topCategoryText.replace('Top:', 'शीर्ष:')}`,
        'en': `Spent: ₹${totalSpent.toLocaleString('en-IN')} | Saved: ${savingsPercent}%${topCategoryText}`,
      },
      data: { type: 'weekly_summary', totalSpent, totalBudget, savings },
      categoryIdentifier: 'finance',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday
      hour: 9,
      minute: 0,
    },
  });

  return identifier;
}

// ─── Cancel Scheduled Notifications ───────────────────────────────────
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.warn('[Notifications] Cancel error:', error);
  }
}

export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[Notifications] Cancel all error:', error);
  }
}

// ─── Get Pending Notifications ────────────────────────────────────────
export async function getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[Notifications] Get pending error:', error);
    return [];
  }
}

// ─── Save Notification Config ─────────────────────────────────────────
export async function saveNotificationConfig(config: NotificationConfig): Promise<void> {
  try {
    await AsyncStorage.setItem('@vani_notification_config', JSON.stringify(config));
  } catch (error) {
    console.error('[Notifications] Save config error:', error);
  }
}

// ─── Load Notification Config ─────────────────────────────────────────
export async function loadNotificationConfig(): Promise<NotificationConfig> {
  try {
    const stored = await AsyncStorage.getItem('@vani_notification_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('[Notifications] Load config error:', error);
  }
  return DEFAULT_CONFIG;
}

// ─── Check Quiet Hours ───────────────────────────────────────────────
export function isQuietHours(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  // Default: 10 PM to 7 AM
  const startTime = 22 * 60; // 22:00
  const endTime = 7 * 60;    // 07:00

  if (startTime > endTime) {
    // Overnight quiet hours (e.g., 22:00 to 07:00)
    return currentTime >= startTime || currentTime < endTime;
  }

  return currentTime >= startTime && currentTime < endTime;
}

// ─── Check FD Maturities ─────────────────────────────────────────────
export async function checkFDMaturities(investments: Array<{
  id: string;
  bank: string;
  amount: number;
  maturityDate: string;
}>): Promise<FD MaturityAlert[]> {
  const alerts: FD MaturityAlert[] = [];
  const now = new Date();

  for (const fd of investments) {
    const maturityDate = new Date(fd.maturityDate);
    const daysUntil = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil <= 30 && daysUntil > 0) {
      alerts.push({
        id: fd.id,
        bank: fd.bank,
        amount: fd.amount,
        maturityDate: fd.maturityDate,
        daysUntilMaturity: daysUntil,
      });
    }
  }

  return alerts;
}

// ─── Check Budget Status ──────────────────────────────────────────────
export async function checkBudgetStatus(budgets: Array<{
  id: string;
  category: string;
  monthlyLimit: number;
  spent: number;
}>): Promise<BudgetAlert[]> {
  const alerts: BudgetAlert[] = [];
  const config = await loadNotificationConfig();

  for (const budget of budgets) {
    const percentage = (budget.spent / budget.monthlyLimit) * 100;

    if (budget.spent > budget.monthlyLimit) {
      // Exceeded
      alerts.push({
        id: budget.id,
        category: budget.category,
        spent: budget.spent,
        limit: budget.monthlyLimit,
        percentage: Math.round(percentage),
        alertType: 'exceeded',
      });
    } else if (percentage >= config.budgetWarningPercent) {
      // Warning
      alerts.push({
        id: budget.id,
        category: budget.category,
        spent: budget.spent,
        limit: budget.monthlyLimit,
        percentage: Math.round(percentage),
        alertType: 'warning',
      });
    }
  }

  return alerts;
}

// ─── Check Savings Milestones ────────────────────────────────────────
export async function checkSavingsMilestones(goals: Array<{
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}>): Promise<MilestoneAlert[]> {
  const alerts: MilestoneAlert[] = [];
  const milestones = [25, 50, 75, 100];
  const notifiedMilestones = await getNotifiedMilestones();

  for (const goal of goals) {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;

    for (const milestone of milestones) {
      if (progress >= milestone && !notifiedMilestones.includes(`${goal.id}_${milestone}`)) {
        alerts.push({
          id: goal.id,
          goalName: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          progress: Math.round(progress),
          milestone,
        });
      }
    }
  }

  return alerts;
}

// ─── Track Notified Milestones ──────────────────────────────────────
async function getNotifiedMilestones(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem('@vani_notified_milestones');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function markMilestoneNotified(goalId: string, milestone: number): Promise<void> {
  try {
    const notified = await getNotifiedMilestones();
    notified.push(`${goalId}_${milestone}`);
    await AsyncStorage.setItem('@vani_notified_milestones', JSON.stringify(notified));
  } catch {}
}

// ─── Schedule All Notifications ──────────────────────────────────────
export async function scheduleAllNotifications(data: {
  fdInvestments?: Array<{ id: string; bank: string; amount: number; maturityDate: string }>;
  budgets?: Array<{ id: string; category: string; monthlyLimit: number; spent: number }>;
  savingsGoals?: Array<{ id: string; name: string; targetAmount: number; currentAmount: number }>;
  weeklySpent?: number;
  weeklyBudget?: number;
  topCategories?: Array<{ category: string; amount: number }>;
}): Promise<void> {
  // Cancel existing notifications
  await cancelAllNotifications();

  // Schedule FD maturity alerts
  if (data.fdInvestments) {
    const fdAlerts = await checkFDMaturities(data.fdInvestments);
    for (const alert of fdAlerts) {
      await scheduleFDMaturityAlert(alert);
    }
  }

  // Schedule budget alerts
  if (data.budgets) {
    const budgetAlerts = await checkBudgetStatus(data.budgets);
    for (const alert of budgetAlerts) {
      await scheduleBudgetAlert(alert);
    }
  }

  // Schedule milestone alerts
  if (data.savingsGoals) {
    const milestones = await checkSavingsMilestones(data.savingsGoals);
    for (const alert of milestones) {
      await scheduleMilestoneAlert(alert);
      await markMilestoneNotified(alert.id, alert.milestone);
    }
  }

  // Schedule weekly summary
  if (data.weeklySpent !== undefined && data.weeklyBudget !== undefined) {
    await scheduleWeeklySummary(
      data.weeklySpent,
      data.weeklyBudget,
      data.topCategories || []
    );
  }
}

export default {
  initializeNotifications,
  scheduleFDMaturityAlert,
  scheduleBudgetAlert,
  scheduleMilestoneAlert,
  scheduleWeeklySummary,
  cancelNotification,
  cancelAllNotifications,
  getPendingNotifications,
  saveNotificationConfig,
  loadNotificationConfig,
  checkFDMaturities,
  checkBudgetStatus,
  checkSavingsMilestones,
  scheduleAllNotifications,
};
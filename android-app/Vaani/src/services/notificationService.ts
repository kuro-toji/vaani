// ═══════════════════════════════════════════════════════════════════
// VAANI Push Notification Service
// FD maturity, Budget alerts, Milestones, Weekly summaries
// ═══════════════════════════════════════════════════════════════════

import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType = 'fd_maturity' | 'budget_warning' | 'budget_exceeded' | 'savings_milestone' | 'weekly_summary' | 'reminder';

export interface NotificationConfig {
  fdMaturityDays: number;
  budgetWarningPercent: number;
  enableHaptic: boolean;
  quietHours: { start: string; end: string };
  weeklySummaryDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  weeklySummaryTime: string;
}

const DEFAULT_CONFIG: NotificationConfig = {
  fdMaturityDays: 7,
  budgetWarningPercent: 80,
  enableHaptic: true,
  quietHours: { start: '22:00', end: '07:00' },
  weeklySummaryDay: 'sunday',
  weeklySummaryTime: '09:00',
};

export interface FDMaturityAlert {
  id: string;
  bank: string;
  amount: number;
  maturityDate: string;
  daysUntilMaturity: number;
}

export interface BudgetAlert {
  id: string;
  category: string;
  spent: number;
  limit: number;
  percentage: number;
  alertType: 'warning' | 'exceeded';
}

export interface MilestoneAlert {
  id: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  milestone: number;
}

export async function initializeNotifications(): Promise<void> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;
    await Notifications.setNotificationCategoryAsync('finance', [
      { id: 'view', title: 'View', options: { opensApp: true } },
      { id: 'dismiss', title: 'Dismiss', options: { opensApp: false } },
    ]);
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true,
      }),
    });
  } catch (error) { console.error('[Notifications] Init error:', error); }
}

export async function scheduleFDMaturityAlert(alert: FDMaturityAlert): Promise<string> {
  const { id, bank, amount, maturityDate, daysUntilMaturity } = alert;
  const maturity = new Date(maturityDate);
  const notifyDate = new Date(maturity);
  notifyDate.setDate(notifyDate.getDate() - 7);
  if (notifyDate < new Date()) notifyDate.setFullYear(notifyDate.getFullYear() + 1);

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏦 FD मैच्योरिटी',
      titleLocalizations: { 'hi': '🏦 FD मैच्योरिटी', 'en': '🏦 FD Maturity Alert' },
      body: `${bank}: ₹${amount.toLocaleString('en-IN')} matures in ${daysUntilMaturity} days`,
      data: { type: 'fd_maturity', id, amount, bank },
      categoryIdentifier: 'finance',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyDate },
  });
}

export async function scheduleBudgetAlert(alert: BudgetAlert): Promise<string> {
  const { id, category, spent, limit, percentage } = alert;
  const remaining = limit - spent;
  const isExceeded = spent > limit;
  const categoryLabels: Record<string, string> = { food: 'खाना', transport: 'यातायात', utilities: 'बिल', entertainment: 'मनोरंजन', health: 'स्वास्थ्य', shopping: 'खरीदारी', rent: 'किराया', other: 'अन्य' };

  try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: isExceeded ? '⚠️ बजट पार!' : '💰 बजट अलर्ट',
      body: `${categoryLabels[category] || category}: ${percentage}% spent. ${isExceeded ? 'Limit crossed!' : `₹${remaining.toLocaleString('en-IN')} remaining`}`,
      data: { type: 'budget', id, category, spent, limit },
      categoryIdentifier: 'finance',
    },
    trigger: null,
  });
}

export async function scheduleMilestoneAlert(alert: MilestoneAlert): Promise<string> {
  const { id, goalName, currentAmount, progress, milestone } = alert;
  try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: `🎉 ${milestone}% माइलस्टोन!`,
      body: `${goalName}: ₹${currentAmount.toLocaleString('en-IN')} saved. ${progress}% complete!`,
      data: { type: 'milestone', id, goalName, progress, milestone },
      categoryIdentifier: 'finance',
    },
    trigger: null,
  });
}

export async function scheduleWeeklySummary(totalSpent: number, totalBudget: number, topCategories: Array<{ category: string; amount: number }>): Promise<string> {
  const savings = totalBudget - totalSpent;
  const savingsPercent = totalBudget > 0 ? ((savings / totalBudget) * 100).toFixed(0) : 0;

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 साप्ताहिक सारांश',
      body: `Spent: ₹${totalSpent.toLocaleString('en-IN')} | Saved: ${savingsPercent}%`,
      data: { type: 'weekly_summary', totalSpent, totalBudget, savings },
      categoryIdentifier: 'finance',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 9, minute: 0 },
  });
}

export async function cancelNotification(identifier: string): Promise<void> {
  try { await Notifications.cancelScheduledNotificationAsync(identifier); } catch {}
}

export async function cancelAllNotifications(): Promise<void> {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
}

export async function getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
  try { return await Notifications.getAllScheduledNotificationsAsync(); } catch { return []; }
}

export async function saveNotificationConfig(config: NotificationConfig): Promise<void> {
  try { await AsyncStorage.setItem('@vani_notification_config', JSON.stringify(config)); } catch {}
}

export async function loadNotificationConfig(): Promise<NotificationConfig> {
  try {
    const stored = await AsyncStorage.getItem('@vani_notification_config');
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_CONFIG;
}

export function isQuietHours(): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  return currentTime >= 22 * 60 || currentTime < 7 * 60;
}

export async function checkFDMaturities(investments: Array<{ id: string; bank: string; amount: number; maturityDate: string }>): Promise<FDMaturityAlert[]> {
  const alerts: FDMaturityAlert[] = [];
  const now = new Date();
  for (const fd of investments) {
    const maturityDate = new Date(fd.maturityDate);
    const daysUntil = Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 30 && daysUntil > 0) {
      alerts.push({ id: fd.id, bank: fd.bank, amount: fd.amount, maturityDate: fd.maturityDate, daysUntilMaturity: daysUntil });
    }
  }
  return alerts;
}

export async function checkBudgetStatus(budgets: Array<{ id: string; category: string; monthlyLimit: number; spent: number }>): Promise<BudgetAlert[]> {
  const alerts: BudgetAlert[] = [];
  const config = await loadNotificationConfig();
  for (const budget of budgets) {
    const percentage = (budget.spent / budget.monthlyLimit) * 100;
    if (budget.spent > budget.monthlyLimit) {
      alerts.push({ id: budget.id, category: budget.category, spent: budget.spent, limit: budget.monthlyLimit, percentage: Math.round(percentage), alertType: 'exceeded' });
    } else if (percentage >= config.budgetWarningPercent) {
      alerts.push({ id: budget.id, category: budget.category, spent: budget.spent, limit: budget.monthlyLimit, percentage: Math.round(percentage), alertType: 'warning' });
    }
  }
  return alerts;
}

export async function checkSavingsMilestones(goals: Array<{ id: string; name: string; targetAmount: number; currentAmount: number }>): Promise<MilestoneAlert[]> {
  const alerts: MilestoneAlert[] = [];
  const milestones = [25, 50, 75, 100];
  try {
    const stored = await AsyncStorage.getItem('@vani_notified_milestones');
    const notifiedMilestones: string[] = stored ? JSON.parse(stored) : [];
    for (const goal of goals) {
      const progress = (goal.currentAmount / goal.targetAmount) * 100;
      for (const milestone of milestones) {
        if (progress >= milestone && !notifiedMilestones.includes(`${goal.id}_${milestone}`)) {
          alerts.push({ id: goal.id, goalName: goal.name, targetAmount: goal.targetAmount, currentAmount: goal.currentAmount, progress: Math.round(progress), milestone });
        }
      }
    }
  } catch {}
  return alerts;
}

export async function markMilestoneNotified(goalId: string, milestone: number): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem('@vani_notified_milestones');
    const notified: string[] = stored ? JSON.parse(stored) : [];
    notified.push(`${goalId}_${milestone}`);
    await AsyncStorage.setItem('@vani_notified_milestones', JSON.stringify(notified));
  } catch {}
}

export async function scheduleAllNotifications(data: {
  fdInvestments?: Array<{ id: string; bank: string; amount: number; maturityDate: string }>;
  budgets?: Array<{ id: string; category: string; monthlyLimit: number; spent: number }>;
  savingsGoals?: Array<{ id: string; name: string; targetAmount: number; currentAmount: number }>;
  weeklySpent?: number;
  weeklyBudget?: number;
}): Promise<void> {
  await cancelAllNotifications();
  if (data.fdInvestments) {
    const fdAlerts = await checkFDMaturities(data.fdInvestments);
    for (const alert of fdAlerts) await scheduleFDMaturityAlert(alert);
  }
  if (data.budgets) {
    const budgetAlerts = await checkBudgetStatus(data.budgets);
    for (const alert of budgetAlerts) await scheduleBudgetAlert(alert);
  }
  if (data.savingsGoals) {
    const milestones = await checkSavingsMilestones(data.savingsGoals);
    for (const alert of milestones) {
      await scheduleMilestoneAlert(alert);
      await markMilestoneNotified(alert.id, alert.milestone);
    }
  }
  if (data.weeklySpent !== undefined && data.weeklyBudget !== undefined) {
    await scheduleWeeklySummary(data.weeklySpent, data.weeklyBudget, []);
  }
}

export default { initializeNotifications, scheduleFDMaturityAlert, scheduleBudgetAlert, scheduleMilestoneAlert, scheduleWeeklySummary, cancelNotification, cancelAllNotifications, getPendingNotifications, saveNotificationConfig, loadNotificationConfig, checkFDMaturities, checkBudgetStatus, checkSavingsMilestones, scheduleAllNotifications };

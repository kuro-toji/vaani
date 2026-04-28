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

// ═══════════════════════════════════════════════════════════════════
// NEW FEATURE MODULE NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════

// ─── Idle Money Alert (daily 9am) ────────────────────────────────
export async function scheduleIdleMoneyAlert(idleAmount: number, suggestedProduct: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 पैसा बेकार बैठा है!',
        body: `₹${idleAmount.toLocaleString('en-IN')} idle hai. ${suggestedProduct} mein lagao toh extra kamaayi hogi!`,
        data: { type: 'idle_money', amount: idleAmount },
        sound: true,
      },
      trigger: { hour: 9, minute: 0, repeats: true } as any,
    });
  } catch (e) { console.error('[Notify] Idle money alert failed:', e); }
}

// ─── Advance Tax Deadline (30 days before) ───────────────────────
export async function scheduleAdvanceTaxAlert(quarter: number, deadlineDate: string, balanceDue: number): Promise<void> {
  if (balanceDue <= 0) return;
  const deadline = new Date(deadlineDate);
  const alertDate = new Date(deadline.getTime() - 30 * 24 * 60 * 60 * 1000);
  if (alertDate <= new Date()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `📋 Advance Tax Q${quarter} Reminder`,
        body: `₹${balanceDue.toLocaleString('en-IN')} bharrna hai ${deadline.toLocaleDateString('hi-IN')} tak. Chalein?`,
        data: { type: 'advance_tax', quarter, amount: balanceDue },
        sound: true,
      },
      trigger: { date: alertDate } as any,
    });
  } catch (e) { console.error('[Notify] Advance tax alert failed:', e); }
}

// ─── TDS Threshold Alert ─────────────────────────────────────────
export async function scheduleTDSThresholdAlert(clientName: string, totalAmount: number): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ TDS Threshold Alert',
        body: `${clientName} se ₹${totalAmount.toLocaleString('en-IN')} aa gaya — ₹1 lakh cross. PAN share karo unke saath.`,
        data: { type: 'tds_threshold', client: clientName, amount: totalAmount },
        sound: true,
      },
      trigger: null, // Immediate
    });
  } catch (e) { console.error('[Notify] TDS alert failed:', e); }
}

// ─── EMI Due Date Reminder (3 days before) ───────────────────────
export async function scheduleEMIReminder(loanType: string, lenderName: string, emiAmount: number, emiDate: number): Promise<void> {
  const now = new Date();
  let nextEMI = new Date(now.getFullYear(), now.getMonth(), emiDate);
  if (nextEMI <= now) nextEMI = new Date(now.getFullYear(), now.getMonth() + 1, emiDate);
  const alertDate = new Date(nextEMI.getTime() - 3 * 24 * 60 * 60 * 1000);
  if (alertDate <= now) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🏦 EMI Due: ${lenderName}`,
        body: `₹${emiAmount.toLocaleString('en-IN')} ka ${loanType} EMI ${emiDate} tarikh ko katega. Balance check karo!`,
        data: { type: 'emi_reminder', loanType, amount: emiAmount },
        sound: true,
      },
      trigger: { date: alertDate } as any,
    });
  } catch (e) { console.error('[Notify] EMI reminder failed:', e); }
}

// ─── Year-End 80C Reminder (Jan-Mar) ─────────────────────────────
export async function schedule80CReminder(remaining: number): Promise<void> {
  if (remaining <= 0) return;
  const now = new Date();
  const month = now.getMonth(); // 0=Jan
  if (month > 2) return; // Only Jan-Mar

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧾 80C Tax Saving Reminder',
        body: `₹${remaining.toLocaleString('en-IN')} ka 80C limit baaki hai! 31 March se pehle ELSS/PPF mein lagao.`,
        data: { type: '80c_reminder', remaining },
        sound: true,
      },
      trigger: { hour: 10, minute: 0, repeats: false } as any,
    });
  } catch (e) { console.error('[Notify] 80C reminder failed:', e); }
}

// ─── Freelancer Payment Reminder ─────────────────────────────────
export async function schedulePaymentReminder(clientName: string, daysSinceLastPayment: number): Promise<void> {
  if (daysSinceLastPayment < 30) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💼 Payment Pending: ${clientName}`,
        body: `${clientName} ka payment ${daysSinceLastPayment} din se pending hai. Follow up karo!`,
        data: { type: 'payment_reminder', client: clientName },
        sound: true,
      },
      trigger: null, // Immediate
    });
  } catch (e) { console.error('[Notify] Payment reminder failed:', e); }
}

export default {
  initializeNotifications, scheduleFDMaturityAlert, scheduleBudgetAlert, scheduleMilestoneAlert,
  scheduleWeeklySummary, cancelNotification, cancelAllNotifications, getPendingNotifications,
  saveNotificationConfig, loadNotificationConfig, checkFDMaturities, checkBudgetStatus,
  checkSavingsMilestones, scheduleAllNotifications,
  // New feature notifications
  scheduleIdleMoneyAlert, scheduleAdvanceTaxAlert, scheduleTDSThresholdAlert,
  scheduleEMIReminder, schedule80CReminder, schedulePaymentReminder,
};


// ═══════════════════════════════════════════════════════════════════
// VAANI Notification Service — Budget Alerts, FD Reminders
// ═══════════════════════════════════════════════════════════════════

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATION_CHANNELS } from '../constants';
import { formatCurrency } from './financeService';

// ─── Setup Notifications ────────────────────────────────────────
export async function setupNotifications(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Android notification channels
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.budget_alerts, {
        name: 'Budget Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EF4444',
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.fd_maturity, {
        name: 'FD Maturity Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.sip_reminders, {
        name: 'SIP Reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.savings_milestones, {
        name: 'Savings Milestones',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return true;
  } catch (error) {
    console.error('[Notifications] Setup failed:', error);
    return false;
  }
}

// ─── Schedule FD Maturity Reminder ──────────────────────────────
export async function scheduleFDMaturityReminder(
  fdId: string,
  bankName: string,
  amount: number,
  maturityDate: string
): Promise<void> {
  const maturity = new Date(maturityDate);
  const now = new Date();

  const reminders = [
    { days: 30, title: 'FD मियाद 30 दिन बाकी' },
    { days: 7, title: 'FD मियाद 7 दिन बाकी' },
    { days: 1, title: 'FD कल मैच्योर होगी!' },
  ];

  for (const reminder of reminders) {
    const triggerDate = new Date(maturity);
    triggerDate.setDate(triggerDate.getDate() - reminder.days);

    if (triggerDate <= now) continue;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: `${bankName} में ${formatCurrency(amount)} की FD ${reminder.days === 1 ? 'कल' : `${reminder.days} दिन में`} मैच्योर होगी।`,
          data: { type: 'fd_maturity', fdId },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
    } catch {}
  }
}

// ─── Budget Overspend Alert ─────────────────────────────────────
export async function sendBudgetAlert(
  category: string,
  percentage: number,
  spent: number,
  limit: number
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: percentage >= 100 ? '🔴 बजट ख़त्म!' : '🟡 बजट अलर्ट',
        body: percentage >= 100
          ? `${category} का बजट ${formatCurrency(limit)} पार हो गया। अभी तक ${formatCurrency(spent)} खर्च।`
          : `${category} का ${percentage}% बजट खर्च हो गया। बाकी ${formatCurrency(limit - spent)}।`,
        data: { type: 'budget_alert', category },
      },
      trigger: null, // Immediate
    });
  } catch {}
}

// ─── Savings Milestone ──────────────────────────────────────────
export async function sendSavingsMilestone(
  goalName: string,
  amount: number
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 बचत मील का पत्थर!',
        body: `बधाई हो! "${goalName}" में ${formatCurrency(amount)} जमा हो गए!`,
        data: { type: 'savings_milestone', goalName },
      },
      trigger: null,
    });
  } catch {}
}

// ─── SIP Reminder ───────────────────────────────────────────────
export async function scheduleSIPReminder(
  fund: string,
  amount: number,
  dayOfMonth: number
): Promise<void> {
  try {
    // Schedule for day before SIP
    const now = new Date();
    const reminderDay = dayOfMonth - 1;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, reminderDay);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'SIP कल देय है',
        body: `कल ${fund} का ${formatCurrency(amount)} SIP कटेगा।`,
        data: { type: 'sip_reminder', fund },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nextMonth },
    });
  } catch {}
}

// ─── Weekly Summary ─────────────────────────────────────────────
export async function sendWeeklySummary(
  totalSpent: number,
  topCategory: string,
  savings: number
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 साप्ताहिक सारांश',
        body: `इस हफ़्ते ${formatCurrency(totalSpent)} खर्च हुआ। सबसे ज़्यादा: ${topCategory}। बचत: ${formatCurrency(savings)}।`,
        data: { type: 'weekly_summary' },
      },
      trigger: null,
    });
  } catch {}
}

// ─── Cancel All ─────────────────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

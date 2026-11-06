// Powered by OnSpace.AI
// Push notifications hook v2 — expo-notifications, local scheduling, deep linking data
import { useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useApp } from '@/hooks/useApp';
import { useI18n } from '@/hooks/useI18n';
import { translateUiText } from '@/services/localizationService';

// Configure how notifications appear when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification data payload types for deep linking
export type NotificationPayload =
  | { type: 'new_plan'; planId: string }
  | { type: 'plan_updated'; planId: string }
  | { type: 'session_reminder'; planId: string }
  | { type: 'new_competition'; compId: string }
  | { type: 'competition_reminder'; compId: string }
  | { type: 'result_posted'; compId: string }
  | { type: 'new_message'; channelId: string; channelName: string }
  | { type: 'athlete_added'; athleteId: string }
  | { type: 'weekly_summary' };

export function getDeepLinkRoute(payload: NotificationPayload): string | null {
  switch (payload.type) {
    case 'new_plan':
    case 'plan_updated':
    case 'session_reminder':
      return payload.planId ? `/plan-detail?id=${encodeURIComponent(payload.planId)}` : '/(tabs)/plans';
    case 'new_competition':
    case 'competition_reminder':
    case 'result_posted':
      return payload.compId ? `/competition-detail?id=${encodeURIComponent(payload.compId)}` : '/(tabs)/competitions';
    case 'new_message':
      return payload.channelId ? `/chat-room?channelId=${encodeURIComponent(payload.channelId)}&name=${encodeURIComponent(payload.channelName || '')}` : '/(tabs)/chat';
    case 'athlete_added':
      return payload.athleteId ? `/athlete-detail?id=${encodeURIComponent(payload.athleteId)}` : '/(tabs)/profile';
    case 'weekly_summary':
      return '/(tabs)';
    default:
      return null;
  }
}

export function usePushNotifications() {
  const { notifSettings } = useApp();
  const { language } = useI18n();
  const languageRef = useRef(language);
  languageRef.current = language;
  const notifSettingsRef = useRef(notifSettings);
  notifSettingsRef.current = notifSettings;

  // Request permission on mount
  useEffect(() => {
    void requestPermission().catch(() => {});
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    // Works on real device and Expo Go — simulators don't support push tokens
    // but local notifications work fine in Expo Go preview
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('appletics', {
        name: 'Appletics',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF5722',
        description: 'Notifications Appletics : plans, compétitions, messages',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  };

  /**
   * Schedule a local notification immediately
   */
  const sendLocalNotification = useCallback(async (
    title: string,
    body: string,
    data?: NotificationPayload
  ) => {
    const granted = await requestPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: translateUiText(title, languageRef.current),
        body: translateUiText(body, languageRef.current),
        data: data ? (data as any) : {},
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'appletics' } : {}),
      },
      trigger: null, // immediate
    });
  }, []);

  /**
   * Schedule a notification at a specific future date
   */
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    scheduledDate: Date,
    data?: NotificationPayload
  ) => {
    const granted = await requestPermission();
    if (!granted) return null;
    if (scheduledDate <= new Date()) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: translateUiText(title, languageRef.current),
        body: translateUiText(body, languageRef.current),
        data: data ? (data as any) : {},
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'appletics' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledDate,
      },
    });
    return id;
  }, []);

  /**
   * Cancel a scheduled notification by ID
   */
  const cancelNotification = useCallback(async (id: string) => {
    await Notifications.cancelScheduledNotificationAsync(id);
  }, []);

  // ── Typed notification triggers ──────────────────────────────────────────

  const notifyNewPlan = useCallback(async (planTitle: string, planId: string) => {
    if (notifSettingsRef.current.notif_new_plan === false) return;
    await sendLocalNotification(
      'Nouveau plan créé',
      `"${planTitle}" a été ajouté à votre programme`,
      { type: 'new_plan', planId }
    );
  }, [sendLocalNotification]);

  const notifyPlanUpdated = useCallback(async (planTitle: string, planId: string) => {
    if (notifSettingsRef.current.notif_plan_updated === false) return;
    await sendLocalNotification(
      'Plan mis à jour',
      `"${planTitle}" a été modifié`,
      { type: 'plan_updated', planId }
    );
  }, [sendLocalNotification]);

  const scheduleSessionReminder = useCallback(async (
    sessionTitle: string,
    sessionDate: Date,
    planId: string
  ) => {
    if (notifSettingsRef.current.notif_session_reminder === false) return null;
    const reminderDate = new Date(sessionDate.getTime() - 30 * 60 * 1000);
    return scheduleNotification(
      'Séance dans 30 minutes',
      `Préparez-vous : ${sessionTitle}`,
      reminderDate,
      { type: 'session_reminder', planId }
    );
  }, [scheduleNotification]);

  const notifyNewCompetition = useCallback(async (compName: string, compDate: string, compId: string) => {
    if (notifSettingsRef.current.notif_new_competition === false) return;
    await sendLocalNotification(
      'Nouvelle compétition',
      `${compName} — ${compDate}`,
      { type: 'new_competition', compId }
    );
  }, [sendLocalNotification]);

  const scheduleCompetitionReminder = useCallback(async (
    compName: string,
    compDate: Date,
    compId: string
  ) => {
    if (notifSettingsRef.current.notif_competition_reminder === false) return null;
    const reminderDate = new Date(compDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(18, 0, 0, 0);
    return scheduleNotification(
      'Compétition demain',
      `${compName} — Pensez à préparer votre équipement !`,
      reminderDate,
      { type: 'competition_reminder', compId }
    );
  }, [scheduleNotification]);

  const notifyResultPosted = useCallback(async (
    athleteName: string,
    event: string,
    result: string,
    compId: string
  ) => {
    if (notifSettingsRef.current.notif_result_posted === false) return;
    await sendLocalNotification(
      'Résultat enregistré',
      `${athleteName} — ${event}: ${result}`,
      { type: 'result_posted', compId }
    );
  }, [sendLocalNotification]);

  const notifyNewMessage = useCallback(async (
    senderName: string,
    channelId: string,
    channelName: string
  ) => {
    if (notifSettingsRef.current.notif_new_message === false) return;
    await sendLocalNotification(
      `Nouveau message — ${channelName}`,
      `${senderName} vous a envoyé un message`,
      { type: 'new_message', channelId, channelName }
    );
  }, [sendLocalNotification]);

  const notifyAthleteAdded = useCallback(async (athleteName: string, athleteId: string) => {
    if (notifSettingsRef.current.notif_athlete_added === false) return;
    await sendLocalNotification(
      'Nouvel athlète',
      `${athleteName} a rejoint votre équipe`,
      { type: 'athlete_added', athleteId }
    );
  }, [sendLocalNotification]);

  const scheduleWeeklySummary = useCallback(async (totalSessions: number, upcomingMeets: number) => {
    if (notifSettingsRef.current.notif_weekly_summary === false) return null;
    const nextSunday = new Date();
    const day = nextSunday.getDay();
    const daysUntilSunday = day === 0 ? 7 : 7 - day;
    nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
    nextSunday.setHours(19, 0, 0, 0);
    return scheduleNotification(
      'Résumé de la semaine',
      `${totalSessions} séance${totalSessions > 1 ? 's' : ''} · ${upcomingMeets} compétition${upcomingMeets > 1 ? 's' : ''} à venir`,
      nextSunday,
      { type: 'weekly_summary' }
    );
  }, [scheduleNotification]);

  return {
    requestPermission,
    sendLocalNotification,
    scheduleNotification,
    cancelNotification,
    notifyNewPlan,
    notifyPlanUpdated,
    scheduleSessionReminder,
    notifyNewCompetition,
    scheduleCompetitionReminder,
    notifyResultPosted,
    notifyNewMessage,
    notifyAthleteAdded,
    scheduleWeeklySummary,
  };
}

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
export async function cancelAccountDeviceNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  // No remote push is configured in this beta. Remove this installation's local reminders on account deletion.
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.dismissAllNotificationsAsync();
}

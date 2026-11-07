import { Platform } from 'react-native';
import { getSupabaseClient } from '@/template';

// Web push notifications for group messages. Work on computer and Android browsers, and on iPhone
// once the app is added to the home screen (iOS 16.4+). Native iPhone builds: not covered here.
const publicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '';
export type PushState = 'unsupported' | 'needs-install' | 'denied' | 'off' | 'on';

const isWeb = () => Platform.OS === 'web' && typeof window !== 'undefined';
const isIos = () => isWeb() && /iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone = () => isWeb() && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

function keyBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, char => char.charCodeAt(0));
}
async function registration() {
  if (!('serviceWorker' in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration('/')) ?? navigator.serviceWorker.register('/sw.js');
}

export async function getPushState(): Promise<PushState> {
  if (!isWeb() || !publicKey) return 'unsupported';
  if (isIos() && !isStandalone()) return 'needs-install';
  if (!('Notification' in window) || !('PushManager' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await registration().catch(() => null);
  const subscription = await reg?.pushManager.getSubscription().catch(() => null);
  return subscription && Notification.permission === 'granted' ? 'on' : 'off';
}

// Must be called from a tap (browsers only show the permission request after a user action).
export async function enablePush(): Promise<PushState> {
  const state = await getPushState();
  if (state === 'unsupported' || state === 'needs-install' || state === 'denied') return state;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';
  const reg = await registration();
  if (!reg) return 'unsupported';
  await navigator.serviceWorker.ready;
  const subscription = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
  const data = subscription.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!data.endpoint || !data.keys?.p256dh || !data.keys?.auth) return 'off';
  const { error } = await getSupabaseClient().from('push_subscriptions').upsert(
    { endpoint: data.endpoint, p256dh: data.keys.p256dh, auth: data.keys.auth, user_agent: navigator.userAgent.slice(0, 200) },
    { onConflict: 'endpoint' },
  );
  if (error) throw new Error('Activation impossible. Réessayez.');
  return 'on';
}

// Fire and forget after a message is sent: the server notifies the other members of the group.
export function notifyGroupMessage(messageId: string) {
  void getSupabaseClient().functions.invoke('appletics-notify-message', { body: { messageId } }).catch(() => {});
}

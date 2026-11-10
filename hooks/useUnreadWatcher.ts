import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { useSharedGroups } from '@/hooks/useSharedGroups';
import { refreshUnread } from '@/services/unreadStore';
import { claimPushForCurrentAccount } from '@/services/pushService';

// Keeps unread message counts (chat list, home, tab bar, app icon badge) up to date.
export function useUnreadWatcher() {
  const shared = useSharedGroups();
  const uid = shared.userId ?? '';
  const groupIds = useMemo(() => [...shared.data.groups, ...shared.data.directs].map(group => group.id).sort(), [shared.data.groups, shared.data.directs]);
  const ids = groupIds.join(',');
  // Notifications of this device go to the account signed in now (several accounts may share a phone).
  useEffect(() => { if (uid) void claimPushForCurrentAccount().catch(() => {}); }, [uid]);
  useEffect(() => {
    if (!uid) return;
    const list = ids ? ids.split(',') : [];
    const run = () => { void refreshUnread(uid, list).catch(() => {}); };
    run();
    const timer = setInterval(() => { if (Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState === 'visible') run(); }, 20000);
    if (Platform.OS !== 'web' || typeof document === 'undefined') return () => clearInterval(timer);
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    const onMessage = (event: MessageEvent) => { if (event.data?.type === 'appletics-push') run(); };
    document.addEventListener('visibilitychange', onVisible);
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); navigator.serviceWorker?.removeEventListener('message', onMessage); };
  }, [uid, ids]);
}

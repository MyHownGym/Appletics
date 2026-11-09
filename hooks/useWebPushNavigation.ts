import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

const PENDING = 'appletics_open_after_start';

// Tapping a web push notification opens the right screen (group chat, plans, competitions):
// - app already open: the service worker sends the address, the app navigates;
// - app closed: it starts on « /?go=<address> », and navigates once the account is ready (after login).
export function useWebPushNavigation(ready: boolean) {
  const router = useRouter();
  const routerRef = useRef(router); routerRef.current = router;
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    try {
      const go = new URLSearchParams(window.location.search).get('go');
      if (go && go.startsWith('/')) { sessionStorage.setItem(PENDING, go); window.history.replaceState(null, '', window.location.pathname); }
    } catch { /* ignore */ }
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'appletics-open' || typeof event.data.url !== 'string' || !event.data.url.startsWith('/')) return;
      try { sessionStorage.setItem(PENDING, event.data.url); } catch { /* ignore */ }
      window.dispatchEvent(new Event('appletics-open'));
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !ready) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const open = () => {
      let target: string | null = null;
      try { target = sessionStorage.getItem(PENDING); sessionStorage.removeItem(PENDING); } catch { /* ignore */ }
      if (!target) return;
      // Leaves time for the start-up redirection (login → home) before opening the screen.
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => routerRef.current.push(target as never), 700);
    };
    open();
    window.addEventListener('appletics-open', open);
    return () => { window.removeEventListener('appletics-open', open); if (timer) clearTimeout(timer); };
  }, [ready]);
}

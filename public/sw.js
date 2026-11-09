// Appletics service worker: makes the app installable, shows notifications (web push),
// keeps the app icon badge (unread messages) and opens the right screen when a notification is tapped.
// Network-first, no stale caching of app code.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});

// Badge counter kept in Cache Storage (the worker can be stopped between two notifications).
const BADGE_URL = '/__appletics_badge__';
async function readBadge() { try { const cache = await caches.open('appletics-state'); const res = await cache.match(BADGE_URL); return res ? Number(await res.text()) || 0 : 0; } catch (_) { return 0; } }
async function writeBadge(count) {
  try { const cache = await caches.open('appletics-state'); await cache.put(BADGE_URL, new Response(String(count))); } catch (_) {}
  try { if (count > 0) await self.navigator.setAppBadge(count); else await self.navigator.clearAppBadge(); } catch (_) {}
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'appletics-badge') event.waitUntil(writeBadge(Math.max(0, Number(event.data.count) || 0)));
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'Appletics';
  event.waitUntil((async () => {
    const isMessage = String(data.tag || '').startsWith('group-');
    if (isMessage) await writeBadge((await readBadge()) + 1);
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) client.postMessage({ type: 'appletics-push', tag: data.tag || '' });
    await self.registration.showNotification(title, {
      body: data.body || 'Nouveau message',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'appletics-message',
      renotify: true,
      data: { url: data.url || '/' },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin);
  const path = target.origin === self.location.origin ? target.pathname + target.search : '/';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.location.origin)) {
        // App already open: it navigates itself (no reload, no return to the home screen).
        client.postMessage({ type: 'appletics-open', url: path });
        try { await client.focus(); } catch (_) {}
        return;
      }
    }
    // App closed: it starts and opens the screen once the account is ready (after the code / Face ID if any).
    await self.clients.openWindow(path === '/' ? '/' : `/?go=${encodeURIComponent(path)}`);
  })());
});

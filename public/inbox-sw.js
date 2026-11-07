// Push notifications for Shane's Inbox (/inbox). This worker only shows notifications and opens the app when
// one is tapped. It has no fetch handler and caches nothing, so it can never serve an old copy of the site.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Inbox', {
    body: data.body || '',
    tag: data.tag,
    data: { url: data.url || '/inbox' },
    icon: '/inbox-192.png',
    badge: '/inbox-192.png',
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/inbox', self.location.origin).href;
  event.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const app = open.find((c) => new URL(c.url).pathname.startsWith('/inbox'));
    if (app) { await app.focus(); return app.navigate(url).catch(() => app.postMessage({ type: 'open', url })); }
    return self.clients.openWindow(url);
  })());
});

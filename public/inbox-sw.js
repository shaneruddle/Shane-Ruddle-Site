// Shane's Reminders app (/inbox): push notifications, plus keeping the app's files on the phone so it opens fast.
// - The page itself (/inbox) always comes from the network when there is signal, so a new deploy shows at once.
//   Only if the network fails or takes over 2.5s is the last copy used, so Reminders still opens on bad signal.
// - Built files under /assets/ have a unique name per version, so a stored copy can never be out of date.
const CACHE = 'inbox-v1';
const SHELL = '/inbox';
const MAX_ASSETS = 120;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith('inbox-') && k !== CACHE).map((k) => caches.delete(k)));
  await self.clients.claim();
})()));

async function trim(cache) {
  const keys = await cache.keys();
  const assets = keys.filter((r) => new URL(r.url).pathname.startsWith('/assets/'));
  await Promise.all(assets.slice(0, Math.max(0, assets.length - MAX_ASSETS)).map((r) => cache.delete(r)));
}

async function page(request) {
  const cache = await caches.open(CACHE);
  const network = fetch(request).then((res) => {
    if (res.ok && res.type === 'basic') cache.put(SHELL, res.clone());
    return res;
  });
  const fallback = new Promise((resolve) => setTimeout(resolve, 2500)).then(() => cache.match(SHELL));
  try {
    const first = await Promise.race([network, fallback]);
    if (first) return first;
    return await network;
  } catch {
    return (await cache.match(SHELL)) || Response.error();
  }
}

async function asset(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') { await cache.put(request, res.clone()); trim(cache); }
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate' && url.pathname === SHELL) { event.respondWith(page(request)); return; }
  if (url.pathname.startsWith('/assets/')) event.respondWith(asset(request));
});

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(data.title || 'Reminders', {
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

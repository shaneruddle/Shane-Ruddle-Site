// Shane Ruddle site — app-shell service worker.
// Hand-written, no build dependency: this file is served as-is from /sw.js.
//
// Strategy:
//  - Never touch cross-origin requests (Firebase Auth/Firestore, Google APIs, etc.) or /api/**
//    (the Cloud Run backend) — those must always hit the network.
//  - Navigations: network-first, falling back to the cached app shell (index.html) when offline.
//  - Same-origin static assets (JS/CSS/images/fonts): stale-while-revalidate, so the app keeps
//    working offline after the first visit and picks up new deploys in the background.

const CACHE_NAME = 'shane-ruddle-shell-v1';
const SHELL_URL = '/index.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(SHELL_URL)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin requests. Firebase Auth/Firestore, Google APIs, fonts CDNs, etc.
  // are left completely alone.
  if (url.origin !== self.location.origin) return;

  // Never intercept the backend API — always go straight to the network.
  if (url.pathname.startsWith('/api/')) return;

  // Navigations (page loads / SPA route changes handled by the browser): network-first,
  // fall back to the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, copy));
          return response;
        })
        .catch(() => caches.match(SHELL_URL).then((cached) => cached || caches.match(request)))
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

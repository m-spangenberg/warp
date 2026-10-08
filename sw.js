/* Warp service worker — makes the app installable and fully offline. */

/* Bump the version when CORE_ASSETS gains/loses files so existing installs
   refresh their precache. (Content-only changes are picked up automatically
   for navigation; assets are cache-first.) */
const CACHE_NAME = 'starfield-warp-v1';

/* Everything the app needs to run with zero network. */
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  /* Activate immediately so updates take effect on next load. */
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  /* Only intercept same-origin requests; external assets (e.g. social
     share images) should keep using the network. */
  if (url.origin !== self.location.origin) return;

  /* Navigations: network-first so edits go live right away, with a
     fallback to the cached app shell when offline. */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match('./index.html'));
        })
    );
    return;
  }

  /* Other same-origin assets: cache-first, then network (and cache it). */
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

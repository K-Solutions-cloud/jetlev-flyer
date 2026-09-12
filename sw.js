/* The deployment builder replaces the version and full offline asset list. */
const VERSION = 'development';
const FILES = ['./', 'index.html', 'style.css', 'level.js', 'effects.js', 'game.js', 'pwa.js', 'manifest.webmanifest', 'assets/jetlev-flyer-logo.jpg'];
const PREFIX = `jetlev:${self.registration.scope}:`;
const CACHE = PREFIX + VERSION;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
  // No skipWaiting: never replace assets underneath an active run.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const url = new URL(request.url);
    const isHome = request.mode === 'navigate' &&
      [self.registration.scope, new URL('index.html', self.registration.scope).href].includes(url.origin + url.pathname);
    const match = await cache.match(isHome ? new URL('index.html', self.registration.scope).href : request);
    return match || fetch(request);
  })());
});

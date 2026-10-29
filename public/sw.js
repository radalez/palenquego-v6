// Service Worker para PalenqueGo PWA
const CACHE_NAME = 'palenquego-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Manejo estándar de red con respaldo silencioso
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

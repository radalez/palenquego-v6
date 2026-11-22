// Service Worker Offline-First para PalenqueGo PWA
const CACHE_VERSION = "v2";
const APP_SHELL_CACHE = `palenquego-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `palenquego-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `palenquego-images-${CACHE_VERSION}`;
const API_CACHE = `palenquego-api-${CACHE_VERSION}`;

const VALID_CACHES = new Set([APP_SHELL_CACHE, STATIC_CACHE, IMAGE_CACHE, API_CACHE]);

const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
  "/placeholder.svg",
  "/banner-top.png",
  "/banner-panda.webp",
];

const BYPASS_HOSTS = [
  "maps.googleapis.com",
  "maps.gstatic.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch(() => null)
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !VALID_CACHES.has(k)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isImageRequest(request, url) {
  if (request.destination === "image") return true;
  return /\.(png|jpe?g|webp|gif|svg|ico)(\?.*)?$/i.test(url.pathname);
}

function isStaticAsset(request, url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (request.destination === "script" || request.destination === "style" || request.destination === "font") {
    return true;
  }
  return /\.(js|css|woff2?|ttf)(\?.*)?$/i.test(url.pathname);
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const shellCache = await caches.open(APP_SHELL_CACHE);
      const fallback = await shellCache.match(fallbackUrl, { ignoreSearch: true });
      if (fallback) return fallback;
    }
    return new Response(JSON.stringify({ offline: true, error: "Sin conexión" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone()).catch(() => {});
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkRes = await networkPromise;
  if (networkRes) return networkRes;

  return new Response("", { status: 504, statusText: "Offline" });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return;
  if (BYPASS_HOSTS.some((host) => url.hostname.includes(host))) return;

  // 1. Navegación HTML (App Shell): Network-First con fallback garantizado a "/"
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, APP_SHELL_CACHE, "/"));
    return;
  }

  // 2. API GET requests (/api-proxy/...): Network-First con fallback a caché local (excluyendo my-bookings/notifications para estado en tiempo real)
  if (url.pathname.startsWith("/api-proxy/") || url.pathname.startsWith("/api/")) {
    if (url.pathname.includes("my-bookings") || url.pathname.includes("notifications")) {
      return;
    }
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 3. Assets estáticos de Next.js (/_next/static/, JS, CSS, fuentes): Stale-While-Revalidate
  if (isStaticAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // 4. Imágenes (locales, Cloudinary, proxy): Stale-While-Revalidate
  if (isImageRequest(request, url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  // 5. Cualquier otro GET del mismo origen: Network-First con respaldo en App Shell
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request, APP_SHELL_CACHE));
  }
});

/*
 * Karawhiua service worker.
 *
 * Strategy:
 *  - Navigations (HTML): network-first, falling back to the cached page, then /offline.html.
 *  - Hashed build assets (/assets/, /_build/): cache-first — content-addressed, safe forever.
 *  - Static images/icons (badges, glyphs, assembly, logos): stale-while-revalidate.
 *  - Supabase / API / server-function requests: never cached (auth-sensitive, always fresh).
 *
 * Bump CACHE_VERSION on any deploy that changes precached files so old caches are dropped.
 */
const CACHE_VERSION = "v2";
const SHELL_CACHE = `karawhiua-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `karawhiua-assets-${CACHE_VERSION}`;
const IMAGE_CACHE = `karawhiua-images-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/offline.html",
  "/KarawhiuaLogo.png",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE, IMAGE_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isHashedAsset(url) {
  return url.pathname.startsWith("/assets/") || url.pathname.startsWith("/_build/");
}

function isStaticImage(url) {
  return (
    /\.(png|jpe?g|svg|webp|gif|ico)$/i.test(url.pathname) ||
    url.pathname.startsWith("/badges/") ||
    url.pathname.startsWith("/glyphs/") ||
    url.pathname.startsWith("/assembly/") ||
    url.pathname.startsWith("/icons/")
  );
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || cache.match("/offline.html");
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache cross-origin (Supabase, Resend, analytics) — network only.
  if (!isSameOrigin(url)) return;

  // Never cache server functions / API endpoints.
  if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (isStaticImage(url)) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }
});

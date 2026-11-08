const CACHE_PREFIX = `guitar-tools:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v3`;

const PRECACHE_URLS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'favicon.png',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
].map((path) => new URL(path, self.registration.scope).href);

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(PRECACHE_URLS);
}

async function cleanOldCaches() {
  const names = await caches.keys();
  await Promise.all(
    names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name))
  );
}

async function storeResponse(request, response) {
  const clone = response.clone();
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, clone);
}

async function navigate(request) {
  try {
    const response = await fetch(request);
    void storeResponse(request, response);
    return response;
  } catch {
    return caches.match(request);
  }
}

async function fetchAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200 && response.type === 'basic') {
    void storeResponse(request, response);
  }
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanOldCaches());
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    event.request.mode === 'navigate' ? navigate(event.request) : fetchAsset(event.request)
  );
});

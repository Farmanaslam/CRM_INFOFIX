// Minimal Service Worker - No caching, just enables PWA install
self.addEventListener("install", (event) => {
  console.log("✅ Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");
  event.waitUntil(
    // Clear any old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
  self.clients.claim();
});

// Pass through all requests - no caching
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

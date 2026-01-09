
const CACHE_NAME = 'infofix-v2';
const DYNAMIC_CACHE_NAME = 'infofix-dynamic-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

// Install SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate SW (Clean up old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            // console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Strategy 1: Network First for HTML (ensure fresh content, fallback to cache for offline)
  // This handles navigation requests to ensure we always try to get the latest app version.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request).then((response) => {
             return response || caches.match('/index.html'); // Fallback to SPA entry
          });
        })
    );
    return;
  }

  // Strategy 2: Stale-While-Revalidate for static assets (CSS, JS, Images, Fonts)
  // This serves cached version immediately while updating in background
  if (
    requestUrl.pathname.match(/\.(js|css|png|jpg|jpeg|svg|json|woff2)$/) ||
    requestUrl.hostname.includes('cdn') ||
    requestUrl.hostname.includes('fonts')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Strategy 3: Network Only for other requests (API calls, etc.)
  // We rely on app-level persistence (LocalStorage/IndexedDB) for data offline capability.
  event.respondWith(
    fetch(event.request).catch(() => {
      // Optional: return a fallback image for failed image requests
      // if (event.request.destination === 'image') {
      //   return caches.match('/offline-image.png');
      // }
      return caches.match(event.request);
    })
  );
});

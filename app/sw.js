// Increment the cache version to force updates
const CACHE_NAME = 'dnd-shop-cache-v3';
const urlsToCache = [
  '/',
  '/static/icons/icon-192x192.png',
  '/static/icons/icon-512x512.png',
  '/manifest.json'
];

// Skip waiting to ensure the new service worker activates immediately
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the new service worker to become active
        return self.skipWaiting();
      })
  );
});

// Add message listener for skipWaiting from the client
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Claim clients to ensure the new service worker takes control immediately
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Network-first strategy for HTML and JSON requests to ensure fresh content
// Cache-first strategy for static assets
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // For HTML and API requests, try network first, then fall back to cache
  if (event.request.mode === 'navigate' || 
      event.request.url.includes('.json') ||
      requestUrl.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // If network fetch fails, try the cache
          return caches.match(event.request);
        })
    );
  } else {
    // For other requests (static assets), try cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          
          // If not in cache, fetch from network
          return fetch(event.request).then(
            response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            }
          );
        })
    );
  }
});
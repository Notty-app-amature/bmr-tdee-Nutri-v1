// Define a name for the cache
const CACHE_NAME = 'bmr-calculator-v1';

// List all the files and resources that need to be cached
const urlsToCache = [
  './index.html', // The main HTML file
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700&display=swap'
];

// --- Installation Event ---
// This event is triggered when the service worker is first installed.
self.addEventListener('install', event => {
  // We use event.waitUntil to ensure the service worker doesn't move on
  // from the installing phase until it has finished executing this code.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Add all the specified URLs to the cache
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources during install:', error);
      })
  );
});

// --- Fetch Event ---
// This event is triggered for every request the page makes (e.g., for CSS, images, data).
self.addEventListener('fetch', event => {
  event.respondWith(
    // Check if the requested resource is already in the cache
    caches.match(event.request)
      .then(response => {
        // If a cached version is found, return it.
        if (response) {
          return response;
        }
        
        // If the resource is not in the cache, fetch it from the network.
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetching failed:', error);
            // Here you could return a fallback page for offline mode if needed
        });
      })
  );
});

// --- Activation Event ---
// This event is triggered when the service worker is activated.
// It's a good place to clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If this cache name is not on the whitelist, delete it.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

const CACHE_NAME = 'main-cache';
const CACHE_ITEMS = [
  '/css/materialize.min.css',
  '/css/style.min.css',
  '/js/jquery-3.4.1.min.js',
  '/js/materialize.min.js',
  '/js/scripts.min.js',

  '/service-worker.js',
  '/manifest.webmanifest',
  '/index.html',

  '/assets/images/logo-144.png',
  '/assets/images/logo-192.png',
  '/assets/images/logo-512.png',
  '/assets/images/logo-150x50.png',

  '/fonts/materialicons.css',
  '/fonts/materialicons.woff2',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(CACHE_ITEMS);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Cache hit - return response
      if (response) {
        console.log('Serving', event.request.url, 'from cache');
        return response;
      }

      console.log('Serving', event.request.url, 'from network');
      return fetch(event.request);
    })
  );
});

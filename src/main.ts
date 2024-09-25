declare const contentBox: HTMLDivElement;

window.addEventListener('load', () => {
  prepareEditor(contentBox);
  contents(contentBox);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript,' + /* js */ `
      'use strict';

      const CACHE_NAME = 'cache-v2';
      const urlsToCache = [
        './',
        './css/style.css',
        './memo-pencil-svgrepo-com.svg',
        './js/main.js'
      ];

      self.addEventListener('install', (event) => {
        event.waitUntil((async () => {
          const cache = await caches.open(CACHE_NAME);
          return cache.addAll(urlsToCache);
        })());
      });

      self.addEventListener('activate', (event) => {
          event.waitUntil((async () => {
            const cacheNames = await caches.keys();
            return Promise.all(
              cacheNames.map((cacheName) => {
                if (cacheName !== CACHE_NAME) {
                  return caches.delete(cacheName);
                }
              })
            );
          )());
      });

      self.addEventListener('fetch', (event) => {
        event.respondWith((async () => {
          const response = await caches.match(event.request);
          if (response) {
            return response;
          }
          const fetchRequest = event.request.clone();
          const response = await fetch(fetchRequest);
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, responseToCache);
          return response;
        })()
        );
      });
    `);
  }
});

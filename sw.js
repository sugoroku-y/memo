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
    await Promise.all(
      cacheNames.map(async (cacheName) => {
        if (cacheName !== CACHE_NAME) {
          await caches.delete(cacheName);
        }
      }),
    );
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    const res = await caches.match(event.request);
    if (res) {
      return res;
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

self.addEventListener('message', (event) => {
  switch (event.data.type) {
    case 'cache-clear':
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(async (key) => {
          await caches.delete(key);
        }));
      })();
      break;
  }
})
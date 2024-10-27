/// <reference lib="esnext" />
/// <reference lib="webworker" />
// @ts-check
'use strict';

(function (
  /** @type {ServiceWorkerGlobalScope & typeof globalThis} */
  self
) {
  const CACHE_NAME = 'cache-v2';
  const urlsToCache = [
    './',
    './js/main.js',
    './css/style.css',
    './icon.svg',
  ];

  self.addEventListener('install', event => {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urlsToCache);
      })()
    );
  });

  self.addEventListener('activate', event => {
    event.waitUntil(
      (async () => {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(
            cacheName => cacheName === CACHE_NAME || caches.delete(cacheName)
          )
        );
      })()
    );
  });

  self.addEventListener('fetch', event => {
    event.respondWith(
      (async () => {
        const res = await caches.match(event.request);
        if (res) {
          return res;
        }
        const fetchRequest = event.request.clone();
        const response = await fetch(fetchRequest);
        if (
          event.request.url.startsWith(location.origin) &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const responseToCache = response.clone();
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, responseToCache);
        }
        return response;
      })()
    );
  });

  self.addEventListener('message', event => {
    switch (event.data.type) {
      case 'cache-clear':
        event.waitUntil(caches.delete(CACHE_NAME));
        break;
    }
  });
})(
  // @ts-expect-error
  self
);

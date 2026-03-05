const CACHE_NAME = 'graphsand-v2';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for everything — any successful fetch gets cached
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        // Also cache opaque (cross-origin) responses for fonts/CDN
        if (response && response.type === 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// Proactive CDN caching triggered from the page
self.addEventListener('message', e => {
  if (e.data === 'precache-cdn') {
    const urls = [
      'https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js',
      'https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js',
      'https://cdn.jsdelivr.net/npm/@babel/standalone@7/babel.min.js',
    ];
    caches.open(CACHE_NAME).then(cache => {
      urls.forEach(url => {
        fetch(url, {mode:'cors'}).then(r => { if(r.ok) cache.put(url, r); }).catch(()=>{});
      });
    });
  }
});

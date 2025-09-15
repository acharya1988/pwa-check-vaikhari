self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');
workbox.setConfig({ debug: false });
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'document',
  new workbox.strategies.NetworkFirst({ cacheName: 'html', networkTimeoutSeconds: 3 })
);
workbox.routing.registerRoute(
  ({ request }) => ['style','script','font'].includes(request.destination),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: 'assets' })
);
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60*60*24*30 })]
  })
);
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: 'api' })
);

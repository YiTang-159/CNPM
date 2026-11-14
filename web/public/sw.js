// Static offline shell only: no API, orders, auth, pricing, uploads or user content is ever cached.
const STATIC_CACHE = 'dubchef-static-v1';
const SAFE_PATHS = [/^\/$/, /^\/index\.html$/, /^\/assets\/[a-zA-Z0-9_.-]+\.(?:css|js|woff2?)$/, /^\/icon-(?:192|512)\.png$/, /^\/apple-touch-icon\.png$/, /^\/manifest\.webmanifest$/];
const isSafe = (request) => {
  const url = new URL(request.url);
  return request.method === 'GET' && url.origin === self.location.origin &&
    !url.pathname.startsWith('/backend') && !url.pathname.startsWith('/api') &&
    !/\b(?:token|auth|user|order|price|checkout|payment)\b/i.test(url.search) &&
    SAFE_PATHS.some(rx => rx.test(url.pathname));
};
self.addEventListener('install', event => { event.waitUntil(caches.open(STATIC_CACHE)); });
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([self.clients.claim(), caches.keys().then(keys => Promise.all(keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k))))]));
});
self.addEventListener('fetch', event => {
  if (!isSafe(event.request)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(STATIC_CACHE).then(c => c.put(event.request,copy)));
    }
    return response;
  }).catch(async () => (await caches.match(event.request)) || Response.error()));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

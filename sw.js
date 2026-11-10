// Keeps the app usable without a connection: the page itself, and every sound clip it has fetched.
const CACHE = 'hej-danmark-v2';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html']).catch(() => {}))); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Sound clips never change once made: serve the saved copy, fetch and save it the first time.
  if (u.pathname.includes('/audio/') || u.pathname.includes('/img/') || u.pathname.includes('/photo/')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(e.request.url);
      if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok) c.put(e.request.url, r.clone());
      return r;
    }));
    return;
  }
  // The page: newest copy when online, saved copy when not.
  if (u.origin === location.origin && (e.request.mode === 'navigate' || u.pathname.endsWith('/index.html') || u.pathname.endsWith('/'))) {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); return r; }).catch(() => caches.match('index.html')));
  }
});

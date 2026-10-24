// Písmenkovo offline: the app is kept on the device; the voice packs are added in the background.
// The page itself is always fetched fresh when online (so updates show at once), the saved copy is used offline.
// Voice packs live in their own cache, so an app update does not download the voice again.
const CACHE = 'pismenkovo-v5';
const VOICE = 'pismenkovo-voice-1';
const CORE = [
  './', './index.html', './manifest.webmanifest', './voice/index.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
  './fonts/baloo-2-latin-500-normal.woff2',   './fonts/baloo-2-latin-600-normal.woff2',   './fonts/baloo-2-latin-700-normal.woff2',   './fonts/baloo-2-latin-800-normal.woff2',   './fonts/baloo-2-latin-ext-500-normal.woff2',   './fonts/baloo-2-latin-ext-600-normal.woff2',   './fonts/baloo-2-latin-ext-700-normal.woff2',   './fonts/baloo-2-latin-ext-800-normal.woff2',
];
const PACKS = ['./voice/pack-0.json', './voice/pack-1.json', './voice/pack-2.json', './voice/pack-3.json', './voice/pack-4.json', './voice/pack-5.json', './voice/pack-6.json', './voice/pack-7.json', './voice/pack-8.json', './voice/pack-9.json', './voice/pack-a.json', './voice/pack-b.json', './voice/pack-c.json', './voice/pack-d.json', './voice/pack-e.json', './voice/pack-f.json', ];
const fresh = u => new Request(u, { cache: 'reload' });   // skip the browser's HTTP cache
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => fetch(fresh(u)).then(r => { if (!r.ok) throw new Error(u); return c.put(u, r); }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== VOICE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => caches.open(VOICE).then(c => Promise.allSettled(PACKS.map(u => c.match(u).then(hit => hit || c.add(u)))))));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  const url = req.url.split('?')[0];
  if (url.includes('/voice/pack-')) {               // voice: saved copy first, never changes
    e.respondWith(caches.open(VOICE).then(async c => (await c.match(url)) || fetch(req).then(r => { if (r.ok) c.put(url, r.clone()); return r; })));
    return;
  }
  if (req.mode === 'navigate' || url.endsWith('/index.html') || url.endsWith('/voice/index.json')) {   // page: newest when online
    e.respondWith(caches.open(CACHE).then(async c => {
      try {
        const r = await fetch(req.mode === 'navigate' ? fresh(url) : new Request(url, { cache: 'no-cache' }));
        if (r.ok) { c.put(req.mode === 'navigate' ? './index.html' : url, r.clone()); return r; }
      } catch (_) {}
      return (await c.match(req.mode === 'navigate' ? './index.html' : url, { ignoreSearch: true })) || Response.error();
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {   // fonts, icons: saved copy, refreshed in the background
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && r.ok) c.put(url, r.clone()); return r; }).catch(() => null);
    return hit || (await net) || Response.error();
  }));
});

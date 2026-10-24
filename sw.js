// Písmenkovo offline: the app is kept on the phone; the voice packs are added in the background.
const CACHE = 'pismenkovo-v4';
const CORE = [
  './', './index.html', './manifest.webmanifest', './voice/index.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
  './fonts/baloo-2-latin-500-normal.woff2',   './fonts/baloo-2-latin-600-normal.woff2',   './fonts/baloo-2-latin-700-normal.woff2',   './fonts/baloo-2-latin-800-normal.woff2',   './fonts/baloo-2-latin-ext-500-normal.woff2',   './fonts/baloo-2-latin-ext-600-normal.woff2',   './fonts/baloo-2-latin-ext-700-normal.woff2',   './fonts/baloo-2-latin-ext-800-normal.woff2', 
];
const PACKS = ['./voice/pack-0.json', './voice/pack-1.json', './voice/pack-2.json', './voice/pack-3.json', './voice/pack-4.json', './voice/pack-5.json', './voice/pack-6.json', './voice/pack-7.json', './voice/pack-8.json', './voice/pack-9.json', './voice/pack-a.json', './voice/pack-b.json', './voice/pack-c.json', './voice/pack-d.json', './voice/pack-e.json', './voice/pack-f.json', ];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim())
    .then(() => caches.open(CACHE).then(c => Promise.allSettled(PACKS.map(u => c.match(u).then(hit => hit || c.add(u)))))));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request.url.split('?')[0], r.clone()); return r; }).catch(() => null);
    return hit || (await net) || (e.request.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});

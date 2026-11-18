/* EE-Toolkit – Service Worker: macht die App offline nutzbar.
   Bei einer neuen Version die Nummer in CACHE erhöhen. */
const CACHE = 'ee-toolkit-v1';
const FILES = ['./', 'index.html', 'style.css', 'manifest.webmanifest',
  'js/core.js', 'js/geo.js', 'js/plots.js', 'js/vec.js', 'js/circuits.js', 'js/ui.js',
  'icons/icon-32.png', 'icons/icon-80.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* Erst aus dem Netz (damit Updates ankommen), ohne Netz aus dem Cache. */
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});

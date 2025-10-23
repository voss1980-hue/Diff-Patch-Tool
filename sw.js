// WICHTIG: Version auf v5 erhöht, um ein Update zu erzwingen
const CACHE_VERSION = 'v5';
const CACHE_NAME = `pwa-cache-${CACHE_VERSION}`;
const OFFLINE_URL = './offline.html';

// WICHTIG: Die Assets der App (CDNs) müssen hier rein
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  
  // Die App-Abhängigkeiten (CDNs) - JETZT NICHT MEHR AUSKOMMENTIERT
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js'
];

self.addEventListener('install', event => {
  console.log('[SW] Installiere Version', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching assets:', ASSETS);
        // Wir verwenden addAll, um alle Assets auf einmal zu cachen
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Aktiviere neue Version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Lösche alten Cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Strategie: Cache First, dann Netzwerk
  event.respondWith(
    caches.match(event.request).then(response => {
      // Aus Cache gefunden
      if (response) {
        return response;
      }

      // Nicht im Cache, also vom Netzwerk holen
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // Prüfen, ob die Antwort gültig ist
          if (networkResponse && networkResponse.status === 200) {
            // Nur 'basic' (eigene Domain) ODER 'cors' (für CDNs) cachen
            if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
          }
          return networkResponse;
        })
        .catch(() => {
          // Netzwerkfehler (offline), Offline-Seite zeigen
          return caches.match(OFFLINE_URL);
        });
      
      return fetchPromise;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Überspringe Warten – aktiviere sofort');
    self.skipWaiting();
  }
});

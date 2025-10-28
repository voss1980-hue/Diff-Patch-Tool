// Neue Cache-Version
const CACHE_NAME = 'pwa-cache-v7'; 
const URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./offline.html",
  "./icons/icon-192x192.png",
  "./icons/icon-512x512.png"
  // Füge hier weitere wichtige Dateien hinzu, falls vorhanden
];

// Installation: Cache füllen & sofort aktivieren
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        // Zwingt den wartenden Service Worker, aktiv zu werden
        return self.skipWaiting(); 
      })
  );
});

// Aktivierung: Alte Caches löschen & Kontrolle übernehmen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Lösche alle Caches, die nicht dem aktuellen Namen entsprechen
          if (cacheName !== CACHE_NAME) { 
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Sagt dem Service Worker, dass er sofort die Kontrolle über geöffnete Seiten übernehmen soll
      return self.clients.claim(); 
    })
  );
});

// Fetch: Netzwerk zuerst, dann Cache, dann Offline-Seite
self.addEventListener('fetch', event => {
  event.respondWith(
    // Versuche zuerst, aus dem Netzwerk zu laden
    fetch(event.request)
      .then(networkResponse => {
        // Optional: Cache aktualisieren, wenn erfolgreich vom Netzwerk geladen
        // caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
        return networkResponse;
      })
      .catch(() => {
        // Wenn Netzwerk fehlschlägt, versuche aus dem Cache zu laden
        return caches.match(event.request)
          .then(cachedResponse => {
            // Wenn im Cache gefunden, zurückgeben
            if (cachedResponse) {
              return cachedResponse;
            }
            // Wenn weder Netzwerk noch Cache, zeige Offline-Seite (nur für Navigation/HTML)
            if (event.request.mode === 'navigate' || 
                (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
              return caches.match('./offline.html');
            }
            // Für andere Anfragen (Bilder, CSS etc.) einfach fehlschlagen lassen
            // return new Response('Offline', { status: 503, statusText: 'Offline' }); 
          });
      })
  );
});

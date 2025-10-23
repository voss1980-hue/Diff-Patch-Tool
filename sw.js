const CN = 'pwa-cache-v1';

const URLS = [
    // Deine App-Dateien
    "/Diff-Patch-Tool/",
    "/Diff-Patch-Tool/index.html",
    "/Diff-Patch-Tool/manifest.json",
    "/Diff-Patch-Tool/offline.html",
    "/Diff-Patch-Tool/icons/icon-192x192.png",
    "/Diff-Patch-Tool/icons/icon-512x512.png",
    
    // Hinzugefügte externe Ressourcen (CDNs)
    "https://cdn.tailwindcss.com",
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
    "https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js"
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CN).then(c => {
            console.log('Caching PWA assets...');
            return c.addAll(URLS);
        })
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(r => {
            // Wenn im Cache gefunden, zurückgeben.
            // Sonst vom Netzwerk holen (und ggf. cachen).
            return r || fetch(e.request);
        }).catch(() => {
            // Bei Fehler (z.B. offline) die Offline-Seite anzeigen
            return caches.match("/Diff-Patch-Tool/offline.html");
        })
    );
});

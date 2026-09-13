// ============================================================
// POINT 49: PWA OFFLINE CLIENT CACHING & RUNTIME ISOLATION
// ============================================================
const CACHE_NAME = "kisanqueue-core-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/css/style.css",
  "/css/ticket.css",
  "/js/app.js",
  "/js/socket-hub.js"
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evt) => {
  // Stale-While-Revalidate Strategy for UI shell
  if (evt.request.method === "GET") {
    evt.respondWith(
      caches.match(evt.request).then((cached) => {
        const fetchPromise = fetch(evt.request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, resClone));
          }
          return networkRes;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
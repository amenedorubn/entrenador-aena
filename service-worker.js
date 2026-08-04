// Service worker — cachea el shell estático para uso offline básico.
// Sube CACHE_VERSION cuando cambies archivos precacheados para forzar la actualización.
const CACHE_VERSION = "v4";
const CACHE_NAME = `aena-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/app.js",
  "./js/engine.js",
  "./js/content.js",
  "./js/curriculum.js",
  "./js/rng.js",
  "./js/gen-numeric.js",
  "./js/gen-abstract.js",
  "./js/gen-verbal.js",
  "./js/gen-english.js",
  "./data/lexicon.js",
  "./data/english.js",
  "./data/sjt.js",
  "./data/real.js",
  "./data/real.enc.json",
  "./data/competencias.js",
  "./icons/favicon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-192-maskable.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first para el shell propio; red directa (sin interceptar) para orígenes externos (p. ej. Google Fonts).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

// Service worker — cachea el shell estático para uso offline básico.
// Sube CACHE_VERSION cuando cambies archivos precacheados para forzar la actualización.
const CACHE_VERSION = "v36";
const CACHE_NAME = `aena-${CACHE_VERSION}`;
// Las imágenes de examen (MB cada una) van a una caché que NO se borra al subir de versión:
// así no se vuelven a descargar en cada actualización y, una vez vistas, cargan sin red.
const IMG_CACHE = "aena-img-v1";
const isExamImage = (url) => url.pathname.includes("/public/assets/exams/");

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
  "./js/version.js",
  "./js/plan.js",
  "./js/stats.js",
  "./js/charts.js",
  "./js/gen-numeric.js",
  "./js/gen-abstract.js",
  "./js/gen-verbal.js",
  "./js/gen-english.js",
  "./data/lexicon.js",
  "./data/english.js",
  "./data/english-notes.js",
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
    // cache:"reload" salta la caché HTTP del navegador: GitHub Pages sirve max-age=600, y
    // con addAll() a secas una versión nueva podía precachear ficheros de la anterior
    // (subidas con <10 min de diferencia) y quedarse "actualizada" con el código viejo.
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== IMG_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first para el shell propio; red directa (sin interceptar) para orígenes externos (p. ej. Google Fonts).
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isExamImage(url)) {
    // Imagen de examen: caché persistente primero; si no está, red. Si la red falla se
    // devuelve un error de red de verdad (nunca index.html: eso dejaba la <img> "rota"
    // sin que el navegador pudiera reintentar).
    event.respondWith(
      caches.open(IMG_CACHE).then((cache) => cache.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => Response.error());
      }))
    );
    return;
  }

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
        .catch(() => (req.mode === "navigate" ? caches.match("./index.html") : Response.error()));
    })
  );
});

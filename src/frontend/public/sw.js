// LekhyaAI Service Worker — caches static assets for near-instant repeat loads
const CACHE_VERSION = "lekhyaai-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Assets to cache on install
const PRECACHE_URLS = ["/", "/index.html", "/env.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("lekhyaai-") && k !== STATIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, API calls, and cross-origin requests
  if (
    request.method !== "GET" ||
    url.pathname.startsWith("/api") ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // For HTML navigation — network first, fall back to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match("/index.html")),
    );
    return;
  }

  // For JS/CSS/fonts/images — cache first, then network update in background
  if (/\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)(\?.*)?$/.test(url.pathname)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        });
        return cached ?? networkFetch;
      }),
    );
  }
});

const CACHE_NAME = "gostop-scoreboard-v6";
const APP_BASE_URL = new URL("./", self.location.href);
const APP_ENTRY_URL = new URL("index.html", APP_BASE_URL).href;
const APP_SHELL = [
  "",
  "index.html",
  "styles.css",
  "src/app.js",
  "src/score.js",
  "src/state.js",
  "manifest.webmanifest",
  "icons/apple-touch-icon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
].map((path) => new URL(path, APP_BASE_URL).href);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
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
            .filter((key) => key.startsWith("gostop-scoreboard-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match(APP_ENTRY_URL)),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
        }
        return response;
      }).catch((error) => {
        if (cachedResponse) return cachedResponse;
        throw error;
      });
      return cachedResponse || networkResponse;
    }),
  );
});

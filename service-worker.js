const CACHE_NAME = "family-rizki-pwa-v27-clean-profile";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./config.js",
  "./assets/logo/abu-adzka-logo.png",
  "./src/app.js?v=inline-family-login-6",
  "./src/logic.mjs",
  "./src/cloud-client.mjs",
  "./manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  // Authentication and photo responses must never enter the offline asset cache.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(response => response || caches.match("./index.html")))
  );
});

self.__WATCH_PARTY_CACHE = "watch-party-pwa-v1";
self.__WATCH_PARTY_ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=pwa-mobile-1",
  "/app.js?v=pwa-mobile-1",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/privacy.html",
  "/terms.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(self.__WATCH_PARTY_CACHE)
      .then((cache) => cache.addAll(self.__WATCH_PARTY_ASSETS))
      .catch(() => null)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== self.__WATCH_PARTY_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(self.__WATCH_PARTY_CACHE).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/") || caches.match("/index.html")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(self.__WATCH_PARTY_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});

self.addEventListener("push", (event) => {
  let payload = { title: "Watch Party", body: "You have a new update." };
  try {
    payload = event.data ? event.data.json() : payload;
  } catch {
    payload = { title: "Watch Party", body: event.data?.text() || "You have a new update." };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Watch Party", {
      body: payload.body || "Open your room to continue.",
      tag: payload.tag || "watch-party",
      data: payload.url || "/",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => "focus" in client);
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    }),
  );
});

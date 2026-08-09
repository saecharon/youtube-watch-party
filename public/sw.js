self.__WATCH_PARTY_CACHE = "zynlivo-pwa-v25";
self.__WATCH_PARTY_ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=zynlivo-simple-9",
  "/app.js?v=zynlivo-simple-9",
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

  if (request.mode === "navigate" || url.pathname === "/" || url.pathname === "/index.html") {
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

  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname === "/sw.js") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(self.__WATCH_PARTY_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request)),
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

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", (event) => {
  let payload = { title: "Zynlivo", body: "You have a new update." };
  try {
    payload = event.data ? event.data.json() : payload;
  } catch {
    payload = { title: "Zynlivo", body: event.data?.text() || "You have a new update." };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Zynlivo", {
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

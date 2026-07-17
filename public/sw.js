self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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

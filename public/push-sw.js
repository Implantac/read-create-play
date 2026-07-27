// Titan Loterias - Push Service Worker
// Handles incoming web push events and notification clicks.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { title: "Titan Loterias", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Titan Loterias";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/favicon.png",
    image: payload.image,
    tag: payload.tag || "titan-push",
    renotify: !!payload.renotify,
    requireInteraction: !!payload.requireInteraction,
    data: {
      url: payload.url || "/dashboard",
      category: payload.category || "system",
    },
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.postMessage({ type: "push-navigate", url: targetUrl });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

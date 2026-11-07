// Keeps a copy of the app on the phone so it opens fast and survives bad Wi-Fi.
// Network first: online phones always get the latest deploy; the cache is only a fallback.
// Only same-origin GETs are handled, so Supabase requests are never cached.
const CACHE = "tu-alert-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// A push arrives even when the app is closed. iPhone requires a visible notification every time.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Show the generic notification below.
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "TU Alert", {
      body: data.body || "Open TU Alert for details.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.id || "tu-alert",
    }),
  );
});

// Tapping the notification opens the app, which shows the full-screen alert.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const app = windows.find((w) => !new URL(w.url).pathname.startsWith("/admin"));
      return app ? app.focus() : self.clients.openWindow("/");
    }),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const shell = await caches.match("/");
          if (shell) return shell;
        }
        return Response.error();
      }),
  );
});

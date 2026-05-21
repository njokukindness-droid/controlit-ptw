// CONTROLIT Service Worker — v3
const CACHE_NAME = "controlit-v3";

// ── Install ───────────────────────────────────────────────────────
self.addEventListener("install", function(e) {
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(self.clients.claim());
});

// ── Push Notification Handler ─────────────────────────────────────
self.addEventListener("push", function(e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; }
  catch(err) { data = { title:"CONTROLIT", body: e.data ? e.data.text() : "New permit update" }; }

  var title = data.title || "CONTROLIT — Permit to Work";
  var options = {
    body: data.body || "You have a new permit notification.",
    icon: "/icons/apple-touch-icon.png",
    badge: "/icons/favicon-16x16.png",
    tag: data.tag || "controlit-" + Date.now(),
    data: { url: data.url || "/app.html" },
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ────────────────────────────────────────────
self.addEventListener("notificationclick", function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || "/app.html";
  e.waitUntil(
    clients.matchAll({ type:"window", includeUncontrolled:true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.includes("app.html") && "focus" in list[i]) {
          return list[i].focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Fetch (pass-through) ──────────────────────────────────────────
self.addEventListener("fetch", function(e) {
  // Let all requests pass through normally
  // No caching to avoid stale app issues
});

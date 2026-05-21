// CONTROLIT Service Worker — v2
// Handles: offline caching, push notifications, notification clicks

const CACHE_NAME = "controlit-v2";
const VAPID_PUBLIC_KEY = "BBYtNHnx4QtdMT5TaKAqpC_eRwZePbpTtXn3OEioBb2aBcqSB56Um6fuvoSG8EuFiHUYDUyCUt6lXe-lBjakvQI";

// ── Install & Cache ───────────────────────────────────────────────
self.addEventListener("install", function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(["/", "/app.html", "/manifest.json"]);
    }).catch(function() {
      // Fail silently if files not found
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// ── Push Notification Handler ─────────────────────────────────────
self.addEventListener("push", function(e) {
  var data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch(err) {
    data = { title: "CONTROLIT", body: e.data ? e.data.text() : "New permit update" };
  }

  var title = data.title || "CONTROLIT — Permit to Work";
  var options = {
    body: data.body || "You have a new permit notification.",
    icon: "/icons/android-chrome-192x192.png",
    badge: "/icons/favicon-32x32.png",
    tag: data.tag || "controlit-notification",
    data: {
      url: data.url || "/app.html",
      permitId: data.permitId || null,
    },
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      { action: "view", title: "View Permit" },
      { action: "dismiss", title: "Dismiss" }
    ]
  };

  // Colour the notification by event type
  var eventColors = {
    submitted: "#D97B00",
    aa_approved: "#0E9E6E",
    osh_approved: "#0E9E6E",
    issued: "#0E9E6E",
    rejected: "#C0392B",
    suspended: "#C0392B",
    ext_requested: "#D97B00",
    expired: "#8B4513",
  };
  if (data.eventType && eventColors[data.eventType]) {
    // badge color hint (supported on some Android)
  }

  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification Click Handler ────────────────────────────────────
self.addEventListener("notificationclick", function(e) {
  e.notification.close();

  if (e.action === "dismiss") return;

  var targetUrl = (e.notification.data && e.notification.data.url) || "/app.html";

  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      // If app is already open, focus it
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes("app.html") && "focus" in client) {
          client.focus();
          if (e.notification.data && e.notification.data.permitId) {
            client.postMessage({
              type: "OPEN_PERMIT",
              permitId: e.notification.data.permitId
            });
          }
          return;
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ── Fetch Handler (offline fallback) ─────────────────────────────
self.addEventListener("fetch", function(e) {
  // Only cache GET requests
  if (e.request.method !== "GET") return;
  // Skip Supabase/API calls
  if (e.request.url.includes("supabase.co") || e.request.url.includes("anthropic.com")) return;

  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request).then(function(cached) {
        return cached || caches.match("/app.html");
      });
    })
  );
});

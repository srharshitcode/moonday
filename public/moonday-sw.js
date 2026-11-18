// public/moonday-sw.js — Background Web Push Service Worker

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Wakes up even when the tab or browser window is closed

self.addEventListener("push", (event) => {
  let payload = {
    title: "MoonDay Sanctuary Reminder",
    body: "Take a gentle moment to check in with your body today.",
    tag: "moonday-push",
    url: "/reminders",
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: "/icon.png",
    badge: "/icon.png",
    tag: payload.tag || `moonday-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [180, 90, 180],
    data: {
      url: payload.url || "/reminders",
    },
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Also allow direct immediate dispatch from an open tab

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "DISPATCH_NOW") {
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/icon.png",
        badge: "/icon.png",
        tag: data.tag || `moonday-now-${Date.now()}`,
        renotify: true,
        data: { url: data.url || "/reminders" },
      })
    );
  }
});

// Focus or open MoonDay when the notification banner is clicked

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/reminders";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
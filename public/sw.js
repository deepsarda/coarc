/// <reference lib="webworker" />

// Service Worker for CO.ARC PWA
// Handles push notifications and basic offline support

const SW = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

// Push notification handler
SW.addEventListener('push', (event) => {
  if (!event.data) return;

  // Build absolute icon URL from SW's origin
  const iconUrl = SW.location.origin + '/icon-192.png';

  try {
    const data = event.data.json();
    const title = data.title || 'CO.ARC';
    const options = {
      body: data.body || 'You have a new notification',
      icon: iconUrl,
      badge: iconUrl,
      tag: data.tag || 'default',
      renotify: true,
      data: {
        url: data.url || '/dashboard',
      },
      vibrate: [200, 100, 200],
    };

    event.waitUntil(SW.registration.showNotification(title, options));
  } catch {
    // Fallback for non-JSON payloads
    event.waitUntil(
      SW.registration.showNotification('CO.ARC', {
        body: event.data.text(),
        icon: iconUrl,
      })
    );
  }
});

// Notification click handler, open the app
SW.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    SW.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if one is open
      for (const client of windowClients) {
        if (client.url.includes(SW.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return SW.clients.openWindow(url);
    })
  );
});

// Install skip waiting to activate immediately
SW.addEventListener('install', () => {
  SW.skipWaiting();
});

// Activate and claim all clients
SW.addEventListener('activate', (event) => {
  event.waitUntil(SW.clients.claim());
});

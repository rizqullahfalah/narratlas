// src/scripts/sw.js

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache semua asset hasil build
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache-first untuk Map Tiles
registerRoute(
  ({ url }) =>
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('stadiamaps.com') ||
    url.hostname.includes('opentopomap.org') ||
    url.hostname.includes('cartodb-basemaps-a.global.ssl.fastly.net') ||
    url.hostname.includes('server.arcgisonline.com'),
  new CacheFirst({
    cacheName: 'map-tiles-v1',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

// Network-first untuk API stories
registerRoute(
  ({ url }) =>
    url.origin.includes('story-api.dicoding.dev') &&
    url.pathname.startsWith('/v1/stories'),
  new NetworkFirst({
    cacheName: 'api-stories',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

// SWR untuk gambar story
registerRoute(
  ({ url }) => url.href.includes('story-api.dicoding.dev/images/'),
  new StaleWhileRevalidate({
    cacheName: 'story-images',
    plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
  })
);

// Offline fallback
registerRoute(
  new NavigationRoute(async ({ event }) => {
    try {
      return await fetch(event.request);
    } catch {
      return caches.match('/offline.html');
    }
  })
);

// PUSH Notification
self.addEventListener('push', (event) => {
  const show = async () => {
    let payload = { title: 'Notifikasi', options: { body: 'Update baru.' } };
    try {
      if (event.data) {
        try {
          payload = await event.data.json();
        } catch {
          const text = await event.data.text();
          payload = { title: 'Notifikasi', options: { body: text } };
        }
      }
    } catch (err) {
      console.error('[SW push] gagal parse payload:', err);
    }

    const BASE_PATH = self.registration.scope.replace(/\/$/, '');

    if (!payload.title) payload.title = 'Notifikasi';
    if (!payload.options) payload.options = {};
    if (!payload.options.body) payload.options.body = 'Update baru.';
    if (!payload.options.icon)
      payload.options.icon = `${BASE_PATH}/images/logo-192.png`;
    if (!payload.options.badge)
      payload.options.badge = `${BASE_PATH}/images/logo-192.png`;

    if (payload?.options?.data?.storyId) {
      payload.options.actions = [
        { action: 'open-detail', title: 'Lihat detail' },
      ];
    }

    await self.registration.showNotification(payload.title, payload.options);
  };

  event.waitUntil(show());
});

// Klik notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const storyId = event.notification?.data?.storyId;

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      const basePath = new URL(self.registration.scope).pathname.replace(/\/$/, '');
      const url = storyId
        ? `${basePath}/#/story/${storyId}`
        : `${basePath}/#/home`;

      const client = allClients.find((c) => c.visibilityState === 'visible');
      if (client) {
        client.navigate(url).then(() => client.focus());
      } else {
        await clients.openWindow(url);
      }
    })()
  );
});

// Simulasi push manual
self.addEventListener('message', (event) => {
  if (event.data?.type === 'simulate-push') {
    const { title, options } = event.data.payload;
    const opts = options || {};
    if (!opts.icon) opts.icon = '/images/logo-192.png';
    if (!opts.badge) opts.badge = '/images/logo-192.png';
    if (!opts.body) opts.body = 'Simulasi pesan notifikasi.';

    self.registration.showNotification(title || 'Simulasi Notifikasi', opts);
  }
});

// Handle jika subscription expired atau berubah
self.addEventListener('pushsubscriptionchange', async (event) => {
  console.log('[SW] Subscription expired, mencoba memperbarui...');

  // pakai langsung dari config.js (disalin di sini karena SW gak bisa import modul JS)
  const VAPID_PUBLIC_KEY =
    'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

  try {
    const newSub = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // kirim ulang subscription baru ke server
    await fetch('https://story-api.dicoding.dev/v1/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub.toJSON()),
    });

    console.log('[SW] Subscription baru berhasil diperbarui!');
  } catch (err) {
    console.error('[SW] Gagal memperbarui subscription:', err);
  }
});

// Helper kecil untuk konversi base64 ke Uint8Array (dibutuhkan di SW)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// src/scripts/utils/index.js

/**
 * Format tanggal jadi string yang lebih mudah dibaca
 * @param {string|Date} date
 * @param {string} locale
 * @param {Object} options
 * @returns {string}
 */
export function showFormattedDate(date, locale = 'id-ID', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

/**
 * Promise delay sederhana
 * @param {number} time dalam ms
 * @returns {Promise}
 */
export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * Cek apakah Service Worker tersedia di browser
 * @returns {boolean}
 */
export function isServiceWorkerAvailable() {
  return 'serviceWorker' in navigator;
}

/**
 * Registrasi Service Worker
 * @returns {Promise<ServiceWorkerRegistration|undefined>}
 */
export async function registerServiceWorker() {
  if (!isServiceWorkerAvailable()) {
    console.warn('Service Worker tidak didukung di browser ini.');
    return;
  }
  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('[SW] registered:', registration);
    return registration;
  } catch (e) {
    console.error('[SW] gagal register:', e);
  }
}

/**
 * Konversi Base64 (VAPID key) ke Uint8Array
 * @param {string} base64String
 * @returns {Uint8Array}
 */
export function convertBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

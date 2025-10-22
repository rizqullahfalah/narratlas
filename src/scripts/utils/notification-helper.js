// src/scripts/utils/notification-helper.js

import { VAPID_PUBLIC_KEY } from '../config';
import { convertBase64ToUint8Array } from './index';
import { subscribePush, unsubscribePush } from '../data/api';

export function isNotificationSupported() {
  return 'Notification' in window;
}
export function isGranted() {
  return Notification.permission === 'granted';
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    alert('Browser tidak mendukung Notification API.');
    return false;
  }
  if (isGranted()) return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function getRegistration() {
  return navigator.serviceWorker.getRegistration();
}

export async function getCurrentSubscription() {
  const reg = await getRegistration();
  return reg?.pushManager.getSubscription();
}

function subscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(VAPID_PUBLIC_KEY),
  };
}

export async function subscribeWebPush() {
  if (!(await requestNotificationPermission())) {
    return { ok: false, message: 'Izin notifikasi ditolak/ditutup.' };
  }
  const reg = await getRegistration();
  if (!reg) return { ok: false, message: 'SW belum terpasang.' };

  let sub = await reg.pushManager.getSubscription();
  if (!sub || !sub.endpoint) {
    sub = await reg.pushManager.subscribe(subscribeOptions());
  }

  const { endpoint, keys } = sub.toJSON();
  const r = await subscribePush({ endpoint, keys });
  if (!r.ok) {
    await sub.unsubscribe().catch(() => {});
    sub = await reg.pushManager.subscribe(subscribeOptions());
    const retry = await subscribePush(sub.toJSON());
    if (!retry.ok) {
      return retry;
    }
    return retry;
  }
  return r;
}

export async function unsubscribeWebPush() {
  const sub = await getCurrentSubscription();
  if (!sub) return { ok: true, message: 'Belum berlangganan.' };
  const { endpoint } = sub;
  const r = await unsubscribePush({ endpoint });
  // pastikan local unsub apapun hasil server
  await sub.unsubscribe().catch(() => {});
  return r;
}

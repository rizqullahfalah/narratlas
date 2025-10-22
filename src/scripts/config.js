// src/scripts/config.js

// Menyimpan URL API
export const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

// Key untuk menyimpan token login di localStorage
export const STORAGE_TOKEN_KEY = 'authToken';

// VAPID public key dari spesifikasi tugas (untuk Push Notification)
export const VAPID_PUBLIC_KEY =
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

const CONFIG = {
  API_BASE_URL,
  STORAGE_TOKEN_KEY,
  VAPID_PUBLIC_KEY,
};

export default CONFIG;

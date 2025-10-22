// src/scripts/utils/auth.js

import { getActiveRoute } from '../routes/url-parser.js';

// Kunci penyimpanan token di localStorage
const TOKEN_KEY = 'authToken';

/**
 * Ambil token dari localStorage.
 * Jika tidak ada, kembalikan null.
 */
export function getAccessToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || token === 'null' || token === 'undefined') {
      return null;
    }
    return token;
  } catch (err) {
    console.error('Gagal membaca token:', err);
    return null;
  }
}

/**
 * Simpan token ke localStorage.
 */
export function saveAccessToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    return true;
  } catch (err) {
    console.error('Gagal menyimpan token:', err);
    return false;
  }
}

/**
 * Hapus token dari localStorage.
 */
export function clearAccessToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (err) {
    console.error('Gagal menghapus token:', err);
    return false;
  }
}

/**
 * Cek apakah halaman hanya boleh untuk guest.
 * Return true kalau boleh diakses, false kalau tidak.
 */
export function guardGuestOnly() {
  const route = getActiveRoute();
  const alreadyLogin = !!getAccessToken();
  return !(alreadyLogin && ['/login', '/register'].includes(route));
}

/**
 * Cek apakah halaman hanya boleh untuk user login.
 * Return true kalau boleh diakses, false kalau tidak.
 */
export function guardAuthOnly() {
  const alreadyLogin = !!getAccessToken();
  return alreadyLogin;
}

/**
 * Proses logout sederhana.
 */
export function doLogout() {
  clearAccessToken();
  localStorage.removeItem('name');
  localStorage.removeItem('userId');
}

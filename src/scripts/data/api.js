// src/scripts/data/api.js

import { getAccessToken } from '../utils/auth.js';
import CONFIG from '../config.js';

const BASE_URL = CONFIG.API_BASE_URL;

const ENDPOINTS = {
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  STORIES: `${BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${BASE_URL}/stories/${id}`,
  PUSH_SUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
};

/**
 * Wrapper fetch → selalu return { ok, status, ...json }
 */
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, ...json };
}

/**
 * Register akun baru
 */
export async function register({ name, email, password }) {
  return fetchJSON(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
}

/**
 * Login user
 */
export async function login({ email, password }) {
  return fetchJSON(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

/**
 * Ambil semua story (bisa dengan pagination & location)
 */
export async function getStories({ page, size, location = 0 } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (size) params.set('size', size);
  if (location != null) params.set('location', location);

  return fetchJSON(`${ENDPOINTS.STORIES}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
}

/**
 * Ambil detail story by id
 */
export async function getStoryById(id) {
  return fetchJSON(ENDPOINTS.STORY_DETAIL(id), {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
}

/**
 * Tambah story baru
 */
export async function addStory({ description, photoFile, lat, lon }) {
  const token = getAccessToken();
  if (!token) {
    console.error('[API] Token tidak ditemukan, user belum login.');
    return { ok: false, status: 401, message: 'Token tidak ditemukan' };
  }

  const form = new FormData();
  form.append('description', description || '');

  // hanya append photo kalau ada file valid
  if (photoFile instanceof File || photoFile instanceof Blob) {
    form.append('photo', photoFile, photoFile.name || 'photo.jpg');
  } else {
    console.warn('[API] photoFile tidak valid atau hilang saat sync.');
  }

  // pastikan lat/lon dikonversi ke angka (dan bukan NaN)
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isNaN(latNum) && !Number.isNaN(lonNum)) {
    form.append('lat', String(latNum));
    form.append('lon', String(lonNum));
  }

  try {
    const res = await fetch(ENDPOINTS.STORIES, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data, message: data?.message };
  } catch (err) {
    console.error('[API.addStory] Error:', err);
    return { ok: false, status: 0, message: err.message };
  }
}

/**
 * Subscribe push notification
 */
export async function subscribePush({ endpoint, keys }) {
  return fetchJSON(ENDPOINTS.PUSH_SUBSCRIBE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ endpoint, keys }),
  });
}

/**
 * Unsubscribe push notification
 */
export async function unsubscribePush({ endpoint }) {
  return fetchJSON(ENDPOINTS.PUSH_SUBSCRIBE, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAccessToken()}`,
    },
    body: JSON.stringify({ endpoint }),
  });
}

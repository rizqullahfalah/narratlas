// src/scripts/data/local-storage.js

export function getLocalTitles() {
  try {
    return JSON.parse(localStorage.getItem('localTitles') || '{}');
  } catch (err) {
    console.warn('getLocalTitles: parse error', err);
    return {};
  }
}

export function saveLocalTitles(titles = {}) {
  try {
    localStorage.setItem('localTitles', JSON.stringify(titles));
  } catch (err) {
    console.warn('saveLocalTitles: storage error', err);
  }
}

export function getItem(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch (err) {
    console.warn('localStorage.getItem error', err);
    return fallback;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn('localStorage.setItem error', err);
  }
}

export function getAuthToken() {
  return getItem('authToken');
}

export function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('localStorage.removeItem error', err);
  }
}

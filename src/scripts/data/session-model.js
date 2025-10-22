// src/scripts/data/session-model.js

import { getItem, setItem, removeItem } from './local-storage.js';
import { getAccessToken, clearAccessToken, saveAccessToken } from '../utils/auth';

const USER_KEY = 'user';

export function saveSession({ token, user }) {
  // simpan token pakai utils/auth
  saveAccessToken(token);

  // simpan data user
  setItem(USER_KEY, JSON.stringify(user));
}

export function getUserName() {
  const data = getItem(USER_KEY);
  try {
    return data ? JSON.parse(data).name : 'User';
  } catch {
    return 'User';
  }
}

export function logoutUser() {
  removeItem(USER_KEY);
  clearAccessToken();
}

export function isAuthenticated() {
  return !!getAccessToken();
}

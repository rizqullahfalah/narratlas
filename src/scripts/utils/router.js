// src/scripts/utils/router.js

export function navigateTo(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  
  window.location.hash = p;
}

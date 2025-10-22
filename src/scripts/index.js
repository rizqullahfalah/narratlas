// src/scripts/index.js

// CSS imports
import '../styles/styles.css';
import App from './pages/app';
import { registerServiceWorker } from './utils';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  // registrasi SW sekali saat boot
  await registerServiceWorker();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });
});

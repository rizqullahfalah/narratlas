// src/scripts/pages/app.js

import routes from '../routes/routes';
import { logoutUser, getUserName, isAuthenticated } from '../data/session-model.js';
import { navigateTo } from '../utils/router.js';
import { getActiveRoute } from '../routes/url-parser';
import Animations from '../utils/animations.js';
import setActiveNav from '../utils/nav-helper.js';
import { isServiceWorkerAvailable } from '../utils/index.js';
import {
  getCurrentSubscription,
  subscribeWebPush,
  unsubscribeWebPush,
} from '../utils/notification-helper.js';
import { syncPendingStories } from '../utils/sync.js';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #activePage = null;
  #particlesInit = false;

  #updateMainMinHeight() {
    const header = document.querySelector('.main-header');
    const footer = document.querySelector('.site-footer');
    const main = this.#content;

    if (header && footer && main) {
      const viewportHeight = window.innerHeight;
      const headerHeight = header.offsetHeight;
      const footerHeight = footer.offsetHeight;

      main.style.minHeight = `${viewportHeight - headerHeight - footerHeight}px`;
    }
  }

  #updateParticlesTarget() {
    if (!this.#particlesInit) return;

    const oldCanvas = document.querySelector('#tsparticles');
    if (oldCanvas) oldCanvas.remove();

    const targetSelector = '.main-header';
    const target = document.querySelector(targetSelector);

    if (target) {
      Animations.particlesElegantNav(targetSelector);
    }
  }

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();

    window.addEventListener('online', async () => {
      console.log('✅ Koneksi kembali online, mulai sinkronisasi offline stories...');
      try {
        const synced = await syncPendingStories();
        if (synced && synced.length > 0) {
          alert(`📤 ${synced.length} cerita offline berhasil dikirim!`);
        } else {
          console.log('Tidak ada cerita offline untuk disinkronkan.');
        }
      } catch (err) {
        console.error('❌ Terjadi kesalahan saat sinkronisasi:', err);
      }
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._deferredPrompt = e;

      const el = document.getElementById('install-tools');
      if (el) {
        el.innerHTML = `<button id="btn-install" class="btn btn-primary">Install App</button>`;
        el.querySelector('#btn-install').addEventListener('click', async () => {
          this._deferredPrompt.prompt();
          const choice = await this._deferredPrompt.userChoice;
          console.log('A2HS:', choice);
          this._deferredPrompt = null;
          el.innerHTML = '';
        });
      }
    });

    window.addEventListener('resize', () => {
      this.#updateMainMinHeight();
      if (window.innerWidth < 992) {
        this.#drawerButton.style.display = 'block';
      } else {
        this.#drawerButton.style.display = 'none';
        this.#navigationDrawer.classList.remove('open');
      }

      this.#updateParticlesTarget();
    });
  }

  _setupDrawer() {
    // Toggle drawer saat klik tombol
    this.#drawerButton.addEventListener('click', (e) => {
      e.stopPropagation(); 
      const isOpen = this.#navigationDrawer.classList.toggle('open');
      this.#drawerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) this.#navigationDrawer.querySelector('a, button, [tabindex]')?.focus();
    });

    // Keyboard tombol
    this.#drawerButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.#drawerButton.click();
      }
    });

    // Tutup drawer saat klik di luar
    document.addEventListener('click', (event) => {
      if (!this.#navigationDrawer.contains(event.target) &&
          event.target !== this.#drawerButton) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      }
    });

    // Tutup drawer saat tekan Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
        this.#drawerButton.focus();
      }
    });

    // Tutup drawer otomatis saat klik link
    this.#navigationDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  async #setupPushTools() {
    if (!isServiceWorkerAvailable()) return;
    const host = document.getElementById('push-notification-tools');
    if (!host) return;

    const isSubscribed = !!(await getCurrentSubscription());
    host.innerHTML = isSubscribed
      ? `<button id="btn-unsub" class="btn">Unsubscribe</button>`
      : `<button id="btn-sub" class="btn btn-primary">Subscribe</button>`;

    host.querySelector('#btn-sub')?.addEventListener('click', async () => {
      const r = await subscribeWebPush();
      alert(r.message || (r.ok ? 'Berhasil berlangganan.' : 'Gagal berlangganan.'));
      await this.#setupPushTools();
    });

    host.querySelector('#btn-unsub')?.addEventListener('click', async () => {
      const r = await unsubscribeWebPush();
      alert(r.message || (r.ok ? 'Berhasil unsubscribe.' : 'Gagal unsubscribe.'));
      await this.#setupPushTools();
    });
  }

  async renderPage() {
    const url = getActiveRoute();

    if (isAuthenticated() && (url === '/login' || url === '/register')) {
      navigateTo('/home');
      return;
    }

    if (!isAuthenticated() && !['/login','/register'].includes(url)) {
      navigateTo('/login');
      return;
    }

    if (this.#activePage?.destroy) {
      try {
        await this.#activePage.destroy();
      } catch (err) {
        console.warn('Destroy error:', err);
      }
    }

    const PageClass = routes[url] || routes['/'];
    const page = new PageClass();
    this.#activePage = page;

    const renderContent = async () => {
      this.#content.innerHTML = await page.render();
      if (page.afterRender) await page.afterRender();
      this._updateAuthLink();
      setActiveNav(window.location.hash);
      this._toggleNavbar(url);
      Animations.brandLogo('.brand-name');

      this.#content.style.height = 'auto';
      this.#updateMainMinHeight();

      if (isAuthenticated() && !this.#particlesInit) {
        setTimeout(() => {
          this.#particlesInit = true;
          this.#updateParticlesTarget();
        }, 50);
      }
    };

    if (document.startViewTransition) {
      await document.startViewTransition(renderContent).finished;
      this.#content.style.height = 'auto';
      this.#updateMainMinHeight();
    } else {
      
      // Fallback manual
      this.#content.classList.add("page-exit");
      requestAnimationFrame(() => {
        this.#content.classList.add("page-exit-active");
        this.#content.addEventListener("transitionend", async () => {
          this.#content.classList.remove("page-exit", "page-exit-active");
          await renderContent();

          this.#content.classList.add("page-enter");
          requestAnimationFrame(() => {
            this.#content.classList.add("page-enter-active");
            this.#content.addEventListener("transitionend", () => {
              this.#content.classList.remove("page-enter", "page-enter-active");
              
              // Reset lagi setelah animasi masuk selesai
              this.#content.style.height = 'auto';
              this.#updateMainMinHeight();
            }, { once: true });
          });
        }, { once: true });
      });
    }

    this.#content.focus();

    await this.#setupPushTools();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        const host = document.getElementById('push-notification-tools');
        if (!host) return;

        const btnSub = host.querySelector('#btn-sub');
        const btnUnsub = host.querySelector('#btn-unsub');

        if (sub) {
          // kalau sudah subscribe tapi tombol belum sesuai
          if (!btnUnsub && btnSub) {
            await this.#setupPushTools();
          }
        } else {
          // kalau belum subscribe tapi tombol masih unsubscribe
          if (!btnSub && btnUnsub) {
            await this.#setupPushTools();
          }
        }
      });
    }
  }

  _updateAuthLink() {
    const authLink = document.getElementById('auth-link');
    const registerLink = document.getElementById('register-link');
    const homeLink = document.querySelector('a[href="#/home"]')?.parentElement;
    const mapLink = document.querySelector('a[href="#/map"]')?.parentElement;
    const newLink = document.querySelector('a[href="#/new"]')?.parentElement;

    if (!authLink || !registerLink) {
      console.warn('Auth link atau register link tidak ditemukan di DOM.');
      return;
    }

    if (isAuthenticated()) {
      const name = getUserName();
      authLink.innerHTML = `
        <div class="auth-wrapper">
          <span class="user-greeting">👋 Hai, ${name}</span>
          <button id="logout-btn" class="btn btn-outline btn-sm">Logout</button>
        </div>
      `;

      registerLink.style.display = 'none';
      if (homeLink) homeLink.style.display = 'list-item';
      if (mapLink) mapLink.style.display = 'list-item';
      if (newLink) newLink.style.display = 'list-item';

      const logoutBtn = document.getElementById('logout-btn');
      logoutBtn.addEventListener('click', () => {
        logoutUser();
        this.#particlesInit = false;
        navigateTo('/login');
      });

    } else {
      authLink.innerHTML = `<a href="#/login">Login</a>`;
      registerLink.style.display = 'list-item';

      if (homeLink) homeLink.style.display = 'none';
      if (mapLink) mapLink.style.display = 'none';
      if (newLink) newLink.style.display = 'none';
    }

    setActiveNav(window.location.hash);
  }

  _toggleNavbar(url) {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    if (['/login', '/register'].includes(url)) {
      navbar.style.display = 'none';
      this.#drawerButton.style.display = 'none';
    } else {
      navbar.style.display = '';

      if (window.innerWidth < 992) {
        this.#drawerButton.style.display = 'block';
      } else {
        this.#drawerButton.style.display = 'none';
        this.#navigationDrawer.classList.remove('open');
      }
    }
  }
}

export default App;

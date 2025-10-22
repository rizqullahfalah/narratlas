// src/scripts/pages/login/login-page.js

import Swal from 'sweetalert2';
import LoginPresenter from './login-presenter.js';
import { navigateTo } from '../../utils/router.js';
import { guardGuestOnly } from '../../utils/auth.js';
import Animations from '../../utils/animations.js';
import * as API from '../../data/api.js';
import * as Auth from '../../utils/auth.js';
import * as Session from '../../data/session-model.js';

export default class LoginPage {
  #presenter;

  async render() {
    if (!guardGuestOnly()) {
      navigateTo('/'); 
      return '';
    }
    
    return `
      <main id="main-content" class="container">
        <h1>Masuk</h1>
        <form id="login-form" class="form-box">
          <div class="form-control">
            <label for="email-input">Email</label>
            <input id="email-input" type="email" required>
          </div>
          <div class="form-control">
            <label for="password-input">Password</label>
            <input id="password-input" type="password" required>
          </div>
          <div id="login-actions">
            <button type="submit" id="login-btn" class="btn">Login</button>
          </div>
        </form>
        <p class="alt-link">Belum punya akun? <a href="#/register">Daftar</a></p>
      </main>
    `;
  }

  async afterRender() {
    Animations.form();
    Animations.pageTitle();

    this.#presenter = new LoginPresenter({
      page: this,
      api: API,
      auth: Auth,
      session: Session,
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email-input').value.trim();
      const password = document.getElementById('password-input').value.trim();
      this.#presenter.handleLogin({ email, password });
    });
  }

  setLoading(isLoading) {
    const btn = document.getElementById('login-btn');
    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Memproses...' : 'Login';
  }

  showError(message) {
    Swal.fire('Login Gagal', message, 'error');
  }

  showSuccess(message) {
    Swal.fire('Login Berhasil', message, 'success');
  }

  redirectToHome() {
    Swal.fire({
      title: 'Berhasil!',
      text: 'Anda akan diarahkan ke halaman utama.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    }).then(() => navigateTo('/home'));
  }
}

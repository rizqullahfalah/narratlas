// src/scripts/pages/register/register-page.js

import Swal from 'sweetalert2';
import RegisterPresenter from './register-presenter.js';
import { navigateTo } from '../../utils/router.js';
import { guardGuestOnly } from '../../utils/auth.js';
import Animations from '../../utils/animations.js';
import * as API from '../../data/api.js';

export default class RegisterPage {
  #presenter;

  async render() {
    if (!guardGuestOnly()) {
      navigateTo('/');
      return '';
    }

    return `
      <main id="main-content" class="container">
        <h1>Buat Akun Baru</h1>
        <form id="register-form" class="form-box" novalidate>
          <div class="form-control">
            <label for="name-input">Nama</label>
            <input id="name-input" type="text" required placeholder="Nama lengkap">
          </div>
          <div class="form-control">
            <label for="email-input">Email</label>
            <input id="email-input" type="email" required placeholder="nama@email.com">
          </div>
          <div class="form-control">
            <label for="password-input">Password</label>
            <input id="password-input" type="password" minlength="6" required placeholder="Minimal 6 karakter">
          </div>
          <div id="register-actions">
            <button type="submit" id="register-btn" class="btn">Daftar</button>
          </div>
        </form>
        <p class="alt-link">Sudah punya akun? <a href="#/login">Login</a></p>
      </main>
    `;
  }

  async afterRender() {
    Animations.form();
    Animations.pageTitle();

    this.#presenter = new RegisterPresenter({
      page: this,
      api: API,
    });

    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById('name-input').value.trim(),
        email: document.getElementById('email-input').value.trim(),
        password: document.getElementById('password-input').value.trim(),
      };

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!data.name) {
        this.showError('Nama wajib diisi.');
        return;
      }
      if (!data.email || !emailPattern.test(data.email)) {
        this.showError('Masukkan email yang valid.');
        return;
      }
      if (!data.password || data.password.length < 6) {
        this.showError('Password minimal 6 karakter.');
        return;
      }

      this.#presenter.processRegister(data);
    });
  }

  setLoading(isLoading) {
    const btn = document.getElementById('register-btn');
    btn.disabled = isLoading;
    btn.textContent = isLoading ? 'Mendaftarkan...' : 'Daftar';
  }

  showError(msg) {
    Swal.fire('Registrasi Gagal', msg, 'error');
  }

  showSuccess(msg) {
    Swal.fire('Registrasi Berhasil', msg, 'success');
  }

  redirectToLogin() { 
    Swal.fire({
      title: 'Registrasi sukses!',
      text: 'Silakan login dengan akun baru Anda.',
      icon: 'success',
      confirmButtonText: 'Login Sekarang'
    }).then(() => navigateTo('/login'));
  }
}

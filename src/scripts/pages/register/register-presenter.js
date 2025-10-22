// src/scripts/pages/register/register-presenter.js

export default class RegisterPresenter {
  #page;
  #api;

  constructor({ page, api }) {
    this.#page = page;
    this.#api = api;
  }

  async processRegister({ name, email, password }) {
    this.#page.setLoading(true);
    try {
      const result = await this.#api.register({ name, email, password });

      if (!result.ok) {
        this.#page.showError(result.message || 'Registrasi gagal');
        return;
      }

      this.#page.showSuccess('Registrasi berhasil, silakan login.');
      this.#page.redirectToLogin();
    } catch (err) {
      this.#page.showError(err.message);
    } finally {
      this.#page.setLoading(false);
    }
  }
}

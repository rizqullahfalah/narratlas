// src/scripts/pages/login/login-presenter.js

export default class LoginPresenter {
  #page;
  #api;
  #auth;
  #session;

  constructor({ page, api, auth, session }) {
    this.#page = page;
    this.#api = api;
    this.#auth = auth;
    this.#session = session;
  }

  async handleLogin({ email, password }) {
    this.#page.setLoading(true);
    try {
      const result = await this.#api.login({ email, password });

      if (!result.ok) {
        this.#page.showError(result.message || 'Gagal masuk');
        return;
      }

      this.#session.saveSession({
        token: result.loginResult.token,
        user: {
          name: result.loginResult.name,
          email: result.loginResult.email,
        },
      });

      this.#page.showSuccess('Berhasil login, mengalihkan...');
      this.#page.redirectToHome();
    } catch (err) {
      this.#page.showError(err.message);
    } finally {
      this.#page.setLoading(false);
    }
  }
}

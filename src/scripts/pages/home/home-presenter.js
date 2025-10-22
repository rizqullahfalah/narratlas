// src/scripts/pages/home/home-presenter.js

import { getStories } from '../../data/api.js';
import { getLocalTitles } from '../../data/local-storage.js';

export default class HomePresenter {
  constructor({ view }) {
    this.view = view;
  }

  async loadStories() {
    try {
      this.view.showLoading();

      const { listStory } = await getStories();

      if (!listStory || listStory.length === 0) {
        this.view.showEmpty();
        return;
      }

      const localTitles = getLocalTitles();
      this.view.showStories(listStory, localTitles);
    } catch (err) {
      if (err?.errorCode === 401) {
        this.view.redirectLogin();
        return;
      }
      this.view.showError(err.message || 'Terjadi kesalahan');
    }
  }
}

// src/scripts/pages/map/map-presenter.js

import { getStories } from '../../data/api.js';
import { getLocalTitles } from '../../data/local-storage.js';

export default class MapPresenter {
  constructor({ view }) {
    this.view = view;
  }

  async loadStories() {
    try {
      const localTitles = getLocalTitles();
      const result = await getStories();
      const stories = result.listStory || [];

      if (stories.length === 0) {
        this.view.showEmptyMessage();
        return;
      }

      this.view.showStories(stories, localTitles);
    } catch (error) {
      console.error('Fetch stories error:', error);
      if (error?.errorCode === 401) {
        this.view.showAuthError();
      } else {
        this.view.showError(error.message || 'Terjadi kesalahan saat memuat data');
      }
    }
  }
}

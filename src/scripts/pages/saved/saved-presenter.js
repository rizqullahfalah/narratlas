// src/scripts/pages/saved/saved-presenter.js

import { FavoriteStoryIdb } from '../../data/favorite-story-idb';
import { getUserName } from '../../data/session-model.js';

export default class SavedPresenter {
  constructor({ view }) {
    this.view = view;
    this.stories = [];
  }

  async showSavedStories() {
    // Ambil hanya story milik user login saat ini
    const currentUser = getUserName();
    this.stories = await FavoriteStoryIdb.getStoriesByUser(currentUser);
    this.view.renderStories(this.stories);

    this._bindDeleteButtons();
  }

  async applyFilter(keyword = '', sort = 'asc') {
    let filtered = [...this.stories];

    // Filter berdasarkan nama atau deskripsi
    if (keyword.trim()) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(keyword.toLowerCase()) ||
          s.description.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    // Sorting berdasarkan nama (asc / desc)
    filtered.sort((a, b) => {
      if (sort === 'asc') return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

    this.view.renderStories(filtered);
    this._bindDeleteButtons();
  }

  _bindDeleteButtons() {
    document.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        await FavoriteStoryIdb.deleteStory(id);
        await this.showSavedStories();
      });
    });
  }
}

// src/scripts/pages/new/new-presenter.js

import { getLocalTitles, saveLocalTitles, getAuthToken } from '../../data/local-storage.js';
import { FavoriteStoryIdb } from '../../data/favorite-story-idb.js';

const STORY_POST_API = 'https://story-api.dicoding.dev/v1/stories';
const MAX_FILE_SIZE = 900 * 1024;

export default class NewPresenter {
  constructor({ view }) {
    this.view = view;
  }

  async submitStory({ title, description, lat, lon, photo }) {
    if (!title || !description) {
      this.view.showError('Lengkapi semua field yang wajib.');
      return;
    }

    if (!photo) {
      this.view.showError('Harap unggah foto atau ambil dari kamera.');
      return;
    }

    if (photo && photo.size > MAX_FILE_SIZE) {
      this.view.showError(
        `Ukuran file terlalu besar (${(photo.size / 1024).toFixed(0)} KB). Maksimal 900 KB.`
      );
      return;
    }

    try {
      this.view.showStatus('Mengirim...');

      // 📌 Jika offline, simpan dulu ke IndexedDB
      if (!navigator.onLine) {
        const objectUrl = URL.createObjectURL(photo);
        const userId = localStorage.getItem('userId') || 'guest';

        const offlineStory = {
          id: `offline-${Date.now()}`,
          title,
          description,
          photoUrl: objectUrl,
          photoFile: photo,
          lat: lat ? Number(lat) : null,
          lon: lon ? Number(lon) : null,
          userId,
          createdAt: new Date().toISOString(),
          isSynced: false,
        };

        await FavoriteStoryIdb.putStory(offlineStory);

        // simpan judul lokal
        const localTitles = getLocalTitles();
        localTitles[offlineStory.id] = title;
        saveLocalTitles(localTitles);

        this.view.showSuccess('Cerita disimpan offline. Akan dikirim saat online.');
        this.view.afterSubmit();
        return;
      }

      // 📌 Jika online, kirim ke API
      const token = getAuthToken();
      if (!token) {
        this.view.showError('Anda harus login dulu sebelum menambah cerita.');
        return;
      }

      const formData = new FormData();
      formData.append('description', description);
      if (lat != null && lon != null) {
        formData.append('lat', lat);
        formData.append('lon', lon);
      }
      if (photo) formData.append('photo', photo);

      const response = await fetch(STORY_POST_API, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'HTTP ' + response.status);

      // simpan judul ke localStorage
      const storyId = data?.storyId || Date.now();
      const localTitles = getLocalTitles();
      localTitles[storyId] = title;
      saveLocalTitles(localTitles);

      this.view.showSuccess('Berhasil mengirim cerita.');
      this.view.afterSubmit();
    } catch (err) {
      console.error('Submit error:', err);
      this.view.showError(`Gagal mengirim: ${err.message}`);
    }
  }
}

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

      // 📌 Simpan ke IndexedDB jika offline
      if (!navigator.onLine) {
        const objectUrl = URL.createObjectURL(photo);

        const offlineStory = {
          id: `offline-${Date.now()}`,
          title,                       // simpan judul
          description,
          photoUrl: objectUrl,
          photoFile: photo,            // simpan file asli agar bisa di-sync
          lat: lat || null,
          lon: lon || null,
          createdAt: new Date().toISOString(),
          isSynced: false,
        };

        await FavoriteStoryIdb.putStory(offlineStory);

        // cleanup blob supaya tidak leak memory
        URL.revokeObjectURL(objectUrl);

        this.view.showSuccess('Cerita disimpan offline. Akan dikirim saat online.');
        this.view.afterSubmit();
        return;
      }

      // 📌 Jika online, langsung kirim ke API
      const token = getAuthToken();
      if (!token) {
        this.view.showError('Anda harus login dulu sebelum menambah cerita.');
        return;
      }

      const formData = new FormData();
      formData.append('description', description);
      if (lat && lon) {
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

      // Simpan judul ke local storage untuk cache judul
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

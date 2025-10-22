// src/scripts/pages/home/home-page.js

import HomePresenter from './home-presenter.js';
import MapWrapper from '../../utils/map-wrapper';
import Animations from '../../utils/animations';
import { navigateTo } from '../../utils/router.js';
import { guardAuthOnly } from '../../utils/auth.js';
import { getUserName } from '../../data/session-model.js';

export default class HomePage {
  #presenter;
  miniMaps = [];
  lastActiveMap = null;

  async render() {
    if (!guardAuthOnly()) {
      navigateTo('/login');
      return '';
    }

    return `
      <main id="main-content">
        <section class="hero">
          <div class="container"> <!-- ini pembungkus isi hero saja -->
            <h1>Selamat Datang di NarrAtlas</h1>
            <p>Temukan cerita dari orang lain, lihat di peta, atau bagikan ceritamu sendiri.</p>
            <div class="hero-actions">
              <a href="#/map" class="btn">Lihat Peta</a>
              <a href="#/new" class="btn btn-outline">Tambah Cerita</a>
            </div>
          </div>
        </section>

        <section class="container story-list-section">
          <h2>Daftar Cerita Terbaru</h2>
          <p class="story-subtitle">
            Untuk melihat lokasi dengan lebih akurat, silakan klik salah satu cerita di bawah ini.  
            Jika cerita memiliki peta, tampilan akan diarahkan ke titik lokasinya.<br>
            <small>⭐ Untuk menyimpan catatanmu, klik tombol "Simpan" pada salah satu cerita.</small>
          </p>
          <div id="story-list" class="story-list" aria-live="polite"></div>
        </section>
      </main>
    `;
  }

  async afterRender() {
    Animations.hero();
    Animations.pageTitle();

    this.#presenter = new HomePresenter({ view: this });
    await this.#presenter.loadStories();
  }

  // ==== View methods ====
  showLoading() {
    document.getElementById('story-list').innerHTML = `<p>Memuat cerita...</p>`;
  }

  showEmpty() {
    document.getElementById('story-list').innerHTML = `<p>Belum ada cerita. Yuk tambahkan cerita pertama!</p>`;
  }

  showStories(stories, localTitles) {
    const storyListEl = document.getElementById('story-list');

    storyListEl.innerHTML = stories.map((story, i) => {
      const title = localTitles[story.id] || story.title || 'Catatan User';
      const hasCoords = story.lat && story.lon;

      // Format tanggal
      const createdDate = story.createdAt ? new Date(story.createdAt) : null;

      const shortDate = createdDate
        ? createdDate.toLocaleDateString('id-ID', { dateStyle: 'long' })
        : 'Tanggal tidak tersedia';

      const timeDetail = createdDate
        ? createdDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '-';

      const getDayPart = (date) => {
        if (!date) return '';
        const hour = date.getHours();
        if (hour >= 5 && hour < 12) return 'Pagi';
        if (hour >= 12 && hour < 15) return 'Siang';
        if (hour >= 15 && hour < 18) return 'Sore';
        return 'Malam';
      };
      const dayPart = getDayPart(createdDate);

      return `
        <article class="story-card" data-index="${i}">
          <img src="${story.photoUrl}" alt="Foto dari ${story.name}" class="story-thumb" />
          <div class="story-info">
            <h3>${title}</h3>
            <p><strong>${story.name}</strong>: ${(story.description || '').substring(0, 100)}</p>
            ${story.isSynced === false 
              ? '<small class="pending-label">Belum terkirim (offline)</small>' 
              : ''}

            <div class="story-meta">
              <small class="story-date">${shortDate}</small>
              <button 
                class="btn-toggle-time" 
                data-index="${i}" 
                aria-expanded="false" 
                aria-controls="time-detail-${i}">
                Lihat Detail Waktu
              </button>
              <div class="story-time-detail hidden" id="time-detail-${i}" hidden>
                <small>Jam: ${timeDetail}</small><br>
                <small>Waktu: ${dayPart}</small>
              </div>
            </div>

            ${
              hasCoords
                ? `<div id="map-${i}" class="mini-map" style="height:150px; margin-top:8px;"></div>`
                : `<small class="no-map-note">Catatan ini tidak memiliki peta</small>`
            }

            <button id="btn-save-story-${story.id}" 
                    class="btn-save-story" 
                    data-id="${story.id}" 
                    data-name="${story.name}" 
                    data-desc="${story.description}" 
                    data-photo="${story.photoUrl}"
                    data-lat="${story.lat || ''}" 
                    data-lon="${story.lon || ''}" 
                    data-date="${story.createdAt || ''}">
              ⭐ Simpan
            </button>
          </div>
        </article>
      `;
    }).join('');

    Animations.storyList();

    this._renderMiniMaps(stories, localTitles);
    this._addCardListeners(stories);

    // Event listener tombol detail waktu
    document.querySelectorAll('.btn-toggle-time').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = btn.dataset.index;
        const detailEl = document.getElementById(`time-detail-${index}`);
        detailEl.classList.toggle('hidden');
        const isHidden = detailEl.classList.contains('hidden');

        btn.setAttribute('aria-expanded', String(!isHidden));
        detailEl.hidden = isHidden;

        btn.textContent = isHidden
          ? 'Lihat Detail Waktu'
          : 'Sembunyikan Detail Waktu';
      });
    });

    // Simpan / Hapus Story
    import('../../data/favorite-story-idb.js').then(async ({ FavoriteStoryIdb }) => {
      const buttons = document.querySelectorAll('.btn-save-story');
      const currentUser = getUserName();

      // Ambil semua story tersimpan di IndexedDB
      const savedStories = await FavoriteStoryIdb.getStoriesByUser(currentUser);
      const savedIds = new Set(savedStories.map(s => s.id));

      // Atur tampilan tombol sesuai status
      buttons.forEach((btn) => {
        const storyId = btn.dataset.id;
        if (savedIds.has(storyId)) {
          btn.textContent = '❌ Hapus';
          btn.classList.add('saved');
        }

        btn.addEventListener('click', async (e) => {
          e.stopPropagation();

          const story = {
            id: btn.dataset.id,
            name: btn.dataset.name,
            description: btn.dataset.desc,
            photoUrl: btn.dataset.photo,
            lat: btn.dataset.lat ? parseFloat(btn.dataset.lat) : null,
            lon: btn.dataset.lon ? parseFloat(btn.dataset.lon) : null,
            createdAt: btn.dataset.date || null,
          };

          const isSaved = savedIds.has(story.id);

          if (isSaved) {
            await FavoriteStoryIdb.deleteStory(story.id);
            savedIds.delete(story.id);
            btn.textContent = '⭐ Simpan';
            btn.classList.remove('saved');
            alert('Story dihapus dari daftar tersimpan.');
          } else {
            await FavoriteStoryIdb.putStory({
              ...story,
              userId: currentUser,
            });
            savedIds.add(story.id);
            btn.textContent = '❌ Hapus';
            btn.classList.add('saved');
            alert('Story berhasil disimpan!');
          }
        });
      });
    });
  }

  _addCardListeners(stories) {
    const cards = document.querySelectorAll('.story-card');
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        const index = Number(card.dataset.index);
        const story = stories[index];
        this._onCardClick(index, story);
      });
    });
  }

  _onCardClick(index, story) {
    // Reset map sebelumnya
    if (this.lastActiveMap !== null && this.lastActiveMap !== index) {
      const prevMap = this.miniMaps[this.lastActiveMap];
      if (prevMap) {
        prevMap.changeCamera(prevMap.defaultCamera.center, prevMap.defaultCamera.zoom);
      }
    }

    // Jika ada koordinat → fokus ke marker
    if (story.lat && story.lon) {
      const map = this.miniMaps[index];
      if (map) {
        map.changeCamera([story.lat, story.lon], 13);
      }
      this.lastActiveMap = index;
    } else {
      // Tidak ada koordinat → tampilkan pesan tambahan
      const card = document.querySelector(`.story-card[data-index="${index}"] .story-info`);
      if (card && !card.querySelector('.no-map-note')) {
        const note = document.createElement('small');
        note.className = 'no-map-note';
        note.textContent = 'Catatan ini tidak memiliki peta';
        card.appendChild(note);
      }
    }
  }

  showError(message) {
    document.getElementById('story-list').innerHTML = `<p class="error">Gagal memuat cerita: ${message}</p>`;
  }

  redirectLogin() {
    navigateTo('/login');
  }

  async _renderMiniMaps(stories, localTitles) {
    this.miniMaps = await Promise.all(
      stories.map(async (story, i) => {
        if (story.lat && story.lon) {
          const containerId = `map-${i}`;
          await new Promise(r => requestAnimationFrame(r));
          const containerEl = document.getElementById(containerId);
          if (!containerEl) return null;

          const map = new MapWrapper(containerId, { zoom: 10 });
          const built = await map.build();
          if (built?.map) {
            const title = localTitles[story.id] || story.title || story.name;
            built.addMarker([story.lat, story.lon], { title }, story.description);
            built.defaultCamera = { center: built.options.center, zoom: built.options.zoom };
            return built;
          }
        }
        return null; 
      })
    );
  }

  async destroy() {
    if (this.miniMaps && this.miniMaps.length > 0) {
      this.miniMaps
        .filter(m => m && m.map)
        .forEach(m => m.map.remove());
    }
    this.miniMaps = [];
  }
}

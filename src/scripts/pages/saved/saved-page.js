// src/scripts/pages/saved/saved-page.js

import SavedPresenter from './saved-presenter.js';
import Animations from '../../utils/animations.js';
import MapWrapper from '../../utils/map-wrapper.js';

export default class SavedPage {
  #presenter;
  miniMaps = [];
  lastActiveMap = null;

  async render() {
    return `
      <main id="main-content" class="container">
        <h1>Story Tersimpan</h1>

				<p class="page-desc">
          Ini adalah halaman yang menampilkan <strong>cerita yang sudah kamu simpan</strong>.  
          Kamu bisa mencari, mengurutkan, atau menghapus cerita dari daftar ini.  
          <em style="display: block; margin-top: 4px;">
            (Catatan: jika cerita memiliki koordinat, maka peta kecil juga akan ditampilkan)
          </em>
          <br>
          <strong>Setiap daftar tersimpan bersifat pribadi dan hanya akan muncul sesuai akun yang sedang login.</strong>  
          Jika kamu masuk dengan akun lain, daftar cerita yang tersimpan mungkin berbeda.
          <br><br>
          Jika ingin membuat cerita baru, silakan klik tombol berikut:
          <a href="#/new" class="btn" style="margin-left: 12px; vertical-align: middle;">Buat Cerita</a>
        </p>

        <div class="toolbar">
          <input id="search-story" type="text" placeholder="Cari cerita..." />
          <select id="sort-story">
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </select>
        </div>

        <div id="stories" class="stories-list"></div>
      </main>
    `;
  }

  async afterRender() {
    this.#presenter = new SavedPresenter({ view: this });
    await this.#presenter.showSavedStories();

    const searchInput = document.getElementById('search-story');
    const sortSelect = document.getElementById('sort-story');

    searchInput.addEventListener('input', () => {
      this.#presenter.applyFilter(searchInput.value, sortSelect.value);
    });

    sortSelect.addEventListener('change', () => {
      this.#presenter.applyFilter(searchInput.value, sortSelect.value);
    });
  }

  renderStories(stories) {
    const container = document.querySelector('#stories');
    if (!stories.length) {
      container.innerHTML = `<p>Belum ada story tersimpan.</p>`;
      return;
    }

    container.innerHTML = stories.map((story, i) => {
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

      const hasCoords = story.lat && story.lon;

      return `
        <article class="story-card" data-index="${i}">
          <img src="${story.photoUrl}" alt="Foto dari ${story.name}" class="story-thumb" />
          <div class="story-info">
            <h3>${story.name}</h3>
            <p>${(story.description || '').substring(0, 100)}</p>
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
                ? `<div id="map-saved-${i}" class="mini-map" style="height:150px; margin-top:8px;"></div>`
                : `<small class="no-map-note">Catatan ini tidak memiliki peta</small>`
            }

            <button class="btn-delete" data-id="${story.id}">Hapus</button>
          </div>
        </article>
      `;
    }).join('');

    Animations.storyList();

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

    this._renderMiniMaps(stories);
		this._addCardListeners(stories);
  }

  async _renderMiniMaps(stories) {
		this.miniMaps = await Promise.all(
			stories.map(async (story, i) => {
				if (story.lat && story.lon) {
					const containerId = `map-saved-${i}`;
					await new Promise(r => requestAnimationFrame(r));
					const containerEl = document.getElementById(containerId);
					if (!containerEl) return null;

					const map = new MapWrapper(containerId, { zoom: 10 });
					const built = await map.build();
					if (built?.map) {
						built.addMarker([story.lat, story.lon], { title: story.name }, story.description);
						built.defaultCamera = { center: built.options.center, zoom: built.options.zoom };
						return built;
					}
				}
				return null;
			})
		);
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
		if (this.lastActiveMap !== null && this.lastActiveMap !== index) {
			const prevMap = this.miniMaps[this.lastActiveMap];
			if (prevMap) {
				prevMap.changeCamera(prevMap.defaultCamera.center, prevMap.defaultCamera.zoom);
			}
		}

		if (story.lat && story.lon) {
			const map = this.miniMaps[index];
			if (map) {
				map.changeCamera([story.lat, story.lon], 13);
			}
			this.lastActiveMap = index;
		} else {
			const card = document.querySelector(`.story-card[data-index="${index}"] .story-info`);
			if (card && !card.querySelector('.no-map-note')) {
				const note = document.createElement('small');
				note.className = 'no-map-note';
				note.textContent = 'Catatan ini tidak memiliki peta';
				card.appendChild(note);
			}
		}
	}
}

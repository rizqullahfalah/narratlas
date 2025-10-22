// src/scripts/pages/map/map-page.js

import MapWrapper from '../../utils/map-wrapper.js';
import MapPresenter from './map-presenter.js';
import Animations from '../../utils/animations.js';

export default class MapPage {
  #presenter;
  map = null;
  markers = [];
  data = [];
  localTitles = {};

  async render() {
    return `
      <main id="main-content" class="container">
        <div class="header-bar">
          <h1>Daftar Cerita di Peta</h1>
        </div>

        <p class="page-desc">
					Ini adalah halaman peta yang menampilkan catatan/cerita dari orang-orang.  
					Silakan klik salah satu catatan di daftar, maka peta akan menunjukkan lokasinya.
					<em style="display: block; margin-top: 4px;">
						(Catatan: hanya cerita yang memiliki koordinat yang bisa ditampilkan di peta)
					</em>
					<br>
					Jika ingin membuat cerita sendiri, silahkan klik tombol di samping
					<a href="#/new" class="btn" style="margin-left: 12px; vertical-align: middle;">Buat Cerita</a>
				</p>

				<div style="margin-bottom:12px;">
					<label for="marker-select"><strong>Pilih Jenis Marker di Peta:</strong></label>
					<select id="marker-select" class="styled-select">
						<option value="photo" selected>Marker Foto User</option>
						<option value="default">Marker Default</option>
						<option value="custom">Marker Custom</option>
					</select>
				</div>

        <div class="grid">
          <div id="story-list" class="story-list" aria-live="polite"></div>
          <div id="map" class="map" aria-label="Peta lokasi cerita" role="region"></div>
        </div>
      </main>
    `;
  }

  async afterRender() {
    Animations.mapPage();
    Animations.pageTitle();

    this.#presenter = new MapPresenter({ view: this });
    this.map = await new MapWrapper('map', { zoom: 5 }).build();

    await this.#presenter.loadStories();
    this._refreshMarkers('photo');

		const markerSelect = document.getElementById('marker-select');
		markerSelect.addEventListener('change', () => {
			this._refreshMarkers(markerSelect.value);
		});
  }

  // View methods
  showEmptyMessage() {
    document.getElementById('story-list').innerHTML = '<p>Belum ada cerita.</p>';
  }

  showAuthError() {
    document.getElementById('story-list').innerHTML = `
      <p class="error">
        Perhatian!! Kamu belum login. 
        <a href="#/login">Login sekarang</a> untuk melihat cerita di peta.
      </p>
    `;
  }

  showError(message) {
    document.getElementById('story-list').innerHTML = `<p class="error">${message}</p>`;
  }

  showStories(stories, localTitles) {
    this.data = stories;
    this.localTitles = localTitles;

    this._renderList();
    this._addMarkers();

    Animations.storyList();
  }

  // Helpers (View side)
  _renderList() {
    const listEl = document.getElementById('story-list');
    listEl.innerHTML = '';

    this.data.forEach((item, index) => {
      const title = this.localTitles[item.id] || item.title || 'Catatan User';

      const article = document.createElement('article');
      article.className = 'story-card';
      article.tabIndex = 0;
      article.setAttribute('data-index', index);

      article.innerHTML = `
        <img src="${item.photoUrl}" alt="Foto cerita dari ${item.name}" class="story-thumb" loading="lazy">
        <div class="story-info">
          <h2>${title}</h2>
          <p><strong>${item.name}</strong>: ${item.description ? item.description.slice(0, 100) : ''}</p>
          <h3>Lokasi</h3>
          <small>📍 ${item.lat}, ${item.lon}</small>
        </div>
      `;

      article.addEventListener('click', () => this._onListClick(index));
      article.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this._onListClick(index);
      });

      listEl.appendChild(article);
    });
  }

  _addMarkers(mode = 'photo') {
		this.markers.forEach(m => m.remove());
		this.markers = [];

		this.data.forEach((item, index) => {
			if (!item.lat || !item.lon) return;

			const title = this.localTitles[item.id] || item.title || item.name;
			const latlng = [item.lat, item.lon];
			const popupContent = `
				<strong>${title}</strong><br>
				oleh <em>${item.name}</em><br>
				${item.description}
			`;

			let iconOptions;

			if (mode === 'photo' && item.photoUrl) {
				// Marker dari foto user
				iconOptions = L.icon({
					iconUrl: item.photoUrl,
					iconSize: [40, 40],
					iconAnchor: [20, 40],
					popupAnchor: [0, -40],
					className: 'story-marker'
				});
			} else if (mode === 'custom') {
				// Marker custom
				iconOptions = L.icon({
					iconUrl: '/images/custom-marker.png',
					shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
					iconSize: [60, 65],
					iconAnchor: [29, 44],
					popupAnchor: [0, -36],
					shadowSize: [41, 41],
					shadowAnchor: [13, 40],
					className: 'custom-marker'
				});
			} else {
				// Marker default Leaflet
				iconOptions = L.icon({
					iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
					shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
					iconSize: [25, 41],
					iconAnchor: [12, 41],
					popupAnchor: [1, -34]
				});
			}

			const marker = this.map.addMarker(latlng, { title, alt: item.name, icon: iconOptions }, popupContent);

			marker._index = index;
			marker.on('click', () => this._onMarkerClick(index));

			this.markers.push(marker);
		});
	}

	_refreshMarkers(mode) {
		this._addMarkers(mode);
	}

  _onListClick(index) {
    const item = this.data[index];
    if (!item || !item.lat || !item.lon) return;

    const latlng = [item.lat, item.lon];
    this.map.changeCamera(latlng, 13);

		const centerNow = this.map.getCenter();
  	console.log("Pusat peta sekarang:", centerNow);

    const marker = this.markers.find((m) => m._index === index);
    if (marker) marker.openPopup();

    this._highlightItem(index);

    const mapEl = document.getElementById('map');
    if (mapEl) {
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  _onMarkerClick(index) {
    this._highlightItem(index);
  }

  _highlightItem(index) {
    const elements = document.querySelectorAll('.story-card');
    elements.forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });

    this.markers.forEach((m) => m.setOpacity(m._index === index ? 1 : 0.6));
  }

  async destroy() {
    if (this.map?.map) {
      this.map.map.remove();
      this.map = null;
    }
    this.markers = [];
  }
}

// src/scripts/pages/new/new-page.js

import Swal from 'sweetalert2';
import MapWrapper from '../../utils/map-wrapper.js';
import { navigateTo } from '../../utils/router.js';
import Animations from '../../utils/animations.js';
import NewPresenter from './new-presenter.js';

export default class NewPage {
  #presenter;
  map = null;
  marker = null;
  mediaStream = null;
  previewFile = null;

  async render() {
    return `
      <main id="main-content" class="container">
        <h1>Tambah Cerita</h1>
        
        <p class="page-desc">
          Halaman ini digunakan untuk menambahkan cerita baru beserta foto dan lokasi Anda. 
          Anda bisa memilih untuk mengunggah foto atau menggunakan kamera, serta menentukan lokasi di peta jika diinginkan.
        </p>

        <form id="new-form" aria-label="Form tambah cerita" novalidate>
          <div class="form-control">
            <label for="title">Judul</label>
            <input id="title" name="title" type="text" required minlength="3" />
            <p id="title-error" class="validation-message"></p>
          </div>

          <div class="form-control">
            <label for="description">Deskripsi</label>
            <textarea id="description" name="description" rows="4" required minlength="10"></textarea>
            <p id="description-error" class="validation-message"></p>
          </div>

          <div class="form-control">
            <label for="photo">Foto (upload atau kamera)</label>
            <input id="photo" name="photo" type="file" accept="image/*" />
            <button type="button" id="camera-btn">Gunakan Kamera</button>
            <div id="camera-preview" hidden inert></div>
            <small id="photo-error" class="validation-message"></small>
          </div>

          <fieldset class="form-control">
            <legend>Lokasi Anda (otomatis terdeteksi, bisa klik peta untuk ubah)</legend>

						<div class="form-control">
							<p class="hint-text">
								Jika ingin mengirim catatan beserta lokasi di peta, silakan nyalakan opsi Gunakan Peta:
							</p>

							<div class="radio-group">
								<label class="radio-option">
									<input type="radio" name="useMap" value="off" checked />
									<span>Tidak gunakan peta</span>
								</label>
								<label class="radio-option">
									<input type="radio" name="useMap" value="on" />
									<span>Gunakan peta</span>
								</label>
							</div>
						</div>

            <div id="map" class="map-small" role="region" aria-label="Peta pilih lokasi" hidden></div>
            <div class="latlng">
              <label for="latitude">Latitude</label>
              <input id="latitude" name="latitude" type="number" step="any" disabled />
              <label for="longitude">Longitude</label>
              <input id="longitude" name="longitude" type="number" step="any" disabled />
            </div>
          </fieldset>

          <div class="form-buttons">
            <button type="submit" class="btn">Kirim</button>
            <a href="#/home" class="btn btn-outline">Batal</a>
          </div>
        </form>

        <div id="status" role="alert" aria-live="assertive" tabindex="-1"></div>
      </main>
    `;
  }

  async afterRender() {
    Animations.pageTitle(); 
    Animations.form();

		this.#presenter = new NewPresenter({ view: this });
		this.form = document.getElementById('new-form');

		// Event handlers
		this.form.addEventListener('submit', (e) => this._onSubmit(e));
		this._initCameraAndFileInput();
		this._addRealtimeValidation();

		// Toggle map
		const radios = this.form.querySelectorAll('input[name="useMap"]');
		const mapEl = document.getElementById('map');

		radios.forEach(radio => {
			radio.addEventListener('change', async (e) => {
				const latInput = this.form.elements.latitude;
				const lonInput = this.form.elements.longitude;

				if (e.target.value === 'on') {
					mapEl.removeAttribute('hidden');
					latInput.disabled = false;
					lonInput.disabled = false;
					latInput.removeAttribute('required');
      		lonInput.removeAttribute('required');

					if (!this.map) {
						this.map = await new MapWrapper('map', { zoom: 5 }).build();
						this._initGeolocation();

            Animations.mapPage();
					}
				} else {
					mapEl.setAttribute('hidden', '');
					latInput.value = '';
					lonInput.value = '';
					latInput.disabled = true;
					lonInput.disabled = true;
					latInput.removeAttribute('required');
      		lonInput.removeAttribute('required');

					if (this.map?.map) {
						this.map.map.remove();
						this.map = null;
						this.marker = null;
					}

					mapEl.innerHTML = "";
				}
			});
		});
	}

  // View methods
  showStatus(message) {
    const status = document.getElementById('status');
    status.className = 'info';
    status.textContent = message;
  }

  showError(message) {
    const status = document.getElementById('status');
    status.className = 'error';
    status.textContent = message;
    status.focus();
  }

  showSuccess(message) {
    const status = document.getElementById('status');
    status.className = 'success';
    status.textContent = message;
    status.focus();
  }

  afterSubmit() {
    this.form.reset();
    const previewContainer = document.getElementById('camera-preview');
    previewContainer.innerHTML = '';
    previewContainer.setAttribute('hidden', '');
		previewContainer.setAttribute('inert', '');
    Swal.fire('Sukses!', 'Cerita berhasil dikirim.', 'success')
      .then(() => navigateTo('/home'));
  }

  // Helpers (View side)
  _onSubmit(e) {
		e.preventDefault();

		if (!this.form.checkValidity()) {
			this.showError('Lengkapi semua field yang wajib.');
			return;
		}

		Swal.fire({
			title: 'Kirim cerita?',
			text: 'Pastikan semua data sudah benar sebelum dikirim.',
			icon: 'question',
			showCancelButton: true,
			confirmButtonText: 'Ya, kirim!',
			cancelButtonText: 'Batal'
		}).then((result) => {
			if (!result.isConfirmed) {
				this.showStatus('Pengiriman dibatalkan.');
				return;
			}

			const title = this.form.elements.title.value.trim();
			const description = this.form.elements.description.value.trim();

			// cek radio
			const radios = this.form.querySelectorAll('input[name="useMap"]');
			let lat = null;
			let lon = null;
			const isMapOn = [...radios].some(r => r.value === 'on' && r.checked);

			if (isMapOn) {
				lat = this.form.elements.latitude.value;
				lon = this.form.elements.longitude.value;

				// validasi manual kalau masih kosong
				if (!lat || !lon) {
					this.showError('Silakan pilih lokasi di peta.');
					return;
				}
			}

			this.#presenter.submitStory({ title, description, lat, lon, photo: this.previewFile });
		});
	}

  _initGeolocation() {
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				async (pos) => {
					const { latitude, longitude } = pos.coords;
					const userLatLng = [latitude, longitude];

					// pastikan map sudah ada
					if (!this.map) {
						this.map = await new MapWrapper('map', { zoom: 5 }).build();
					}

					this.map.changeCamera(userLatLng, 13);

					this.marker = this.map.addMarker(userLatLng, { title: 'Lokasi Anda' }, 'Lokasi Anda sekarang');
					this.marker.dragging?.enable?.();
					this._updateLatLngInputs(latitude, longitude);

					this.marker.on('drag', (e) => {
						const { lat, lng } = e.target.getLatLng();
						this._updateLatLngInputs(lat, lng);
					});

					this.map.addMapEventListener('click', (e) => {
						if (!this.map) return;
						this.marker.setLatLng(e.latlng);
						this._updateLatLngInputs(e.latlng.lat, e.latlng.lng);
						this.map.changeCamera([e.latlng.lat, e.latlng.lng], 13);
					});
				},
        (err) => {
          console.warn('Geolocation error:', err.message);
          alert('Tidak bisa mengambil lokasi Anda. Gunakan peta untuk memilih lokasi.');

          const center = this.map.getCenter();
          const marker = this.map.addMarker([lat, lng], { title: 'Lokasi awal' }, '');
          marker.dragging?.enable?.();
          this._updateLatLngInputs(center.latitude, center.longitude);
        }
      );
    } else {
      alert('Browser Anda tidak mendukung geolokasi.');
    }
  }

  _initCameraAndFileInput() {
		const cameraBtn = document.getElementById('camera-btn');
		const fileInput = this.form.elements.photo;

		if (cameraBtn) {
			cameraBtn.addEventListener('click', () => {
				if (this.mediaStream) {
					// kamera nyala → matikan
					this._stopCamera();
					cameraBtn.textContent = 'Gunakan Kamera';
					if (fileInput) fileInput.disabled = false;
				} else {
					// kamera mati → nyalakan
					this.previewFile = null;
					this._startCamera();
					cameraBtn.textContent = 'Matikan Kamera';
					if (fileInput) fileInput.disabled = true;
				}
			});
		}

		if (fileInput) {
			fileInput.addEventListener('change', (e) => this._onFileChange(e));
		}
	}

  _addRealtimeValidation() {
    const titleInput = this.form.elements.title;
    const descInput = this.form.elements.description;
    const titleError = document.getElementById('title-error');
    const descError = document.getElementById('description-error');

    // Judul
    titleInput.addEventListener('input', () => {
      if (titleInput.validity.valueMissing) {
        titleError.textContent = 'Judul wajib diisi';
      } else if (titleInput.validity.tooShort) {
        titleError.textContent = 'Judul minimal 3 karakter';
      } else {
        titleError.textContent = '';
      }
    });

    // Deskripsi
    descInput.addEventListener('input', () => {
      if (descInput.validity.valueMissing) {
        descError.textContent = 'Deskripsi wajib diisi';
      } else if (descInput.validity.tooShort) {
        descError.textContent = 'Deskripsi minimal 10 karakter';
      } else {
        descError.textContent = '';
      }
    });
  }

  _updateLatLngInputs(lat, lng) {
    this.form.elements.latitude.value = lat;
    this.form.elements.longitude.value = lng;
  }

  _onFileChange(e) {
		const file = e.target.files[0];
		this.previewFile = null;
		const photoError = document.getElementById('photo-error');
		photoError.textContent = '';

		if (!file) return;
		if (file.size > 900 * 1024) {
			photoError.textContent = `Ukuran file terlalu besar (${(file.size/1024).toFixed(0)} KB). Maksimal 900 KB.`;
			e.target.value = '';
			return;
		}

		this.previewFile = file;

		const container = document.getElementById('camera-preview');
		container.innerHTML = '';

		// Tampilkan preview
		const preview = document.createElement('img');
		preview.alt = 'Preview foto';
		preview.width = 240;
		preview.loading = 'lazy';
		preview.src = URL.createObjectURL(file);
		container.appendChild(preview);

		// Tombol batal upload
		const cameraBtn = document.getElementById('camera-btn');
		const cancelBtn = document.createElement('button');
		cancelBtn.type = 'button';
		cancelBtn.textContent = 'Batal Upload Foto';
		cancelBtn.className = 'btn btn-outline';
		cancelBtn.addEventListener('click', () => {
			this.previewFile = null;
			e.target.value = '';               
			container.innerHTML = '';          
			container.setAttribute('hidden', '');
			container.setAttribute('inert', '');
			if (cameraBtn) cameraBtn.disabled = false; 
		});
		container.appendChild(cancelBtn);

		// saat berhasil upload → kamera dimatikan dulu
		if (cameraBtn) cameraBtn.disabled = true;

		container.removeAttribute('hidden'); 
		container.removeAttribute('inert');
	}

  async _startCamera() {
    const container = document.getElementById('camera-preview');
    container.removeAttribute('hidden');
    container.removeAttribute('inert');

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.srcObject = this.mediaStream;
      video.width = 320;

      container.innerHTML = '';
      container.appendChild(video);

      const snapBtn = document.createElement('button');
      snapBtn.type = 'button';
      snapBtn.textContent = 'Ambil Foto';
      snapBtn.className = 'btn';

      snapBtn.addEventListener('click', () => this._captureFromVideo(video));
      container.appendChild(snapBtn);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Tidak dapat mengakses kamera');
    }
  }

  _stopCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }

    const container = document.getElementById('camera-preview');
    const snapBtn = container.querySelector('button');
    if (snapBtn) snapBtn.remove();
  }

  _captureFromVideo(video) {
    if (!video.videoWidth || !video.videoHeight) {
      Swal.fire('Oops!', 'Video belum siap, coba klik lagi setelah kamera menyala.', 'info');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) {
        alert('Gagal mengambil gambar, coba lagi.');
        return;
      }

      const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
      this.previewFile = file;

      const container = document.getElementById('camera-preview');
      container.innerHTML = '';

      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = 'Foto hasil kamera';
      img.width = 240;
      container.appendChild(img);

      Animations.cameraFlash();

			// Tombol download
      const downloadBtn = document.createElement('a');
      downloadBtn.href = URL.createObjectURL(file);
      downloadBtn.download = file.name;
      downloadBtn.textContent = 'Download Foto';
      downloadBtn.className = 'btn btn-outline';
      container.appendChild(downloadBtn);

			const cancelBtn = document.createElement('button');
			cancelBtn.type = 'button';
			cancelBtn.textContent = 'Batal Foto';
			cancelBtn.className = 'btn btn-outline';
			cancelBtn.addEventListener('click', () => {
				this.previewFile = null;
				container.innerHTML = '';
				container.setAttribute('hidden', '');
				container.setAttribute('inert', '');
				const cameraBtn = document.getElementById('camera-btn');
				if (cameraBtn) {
					cameraBtn.textContent = 'Gunakan Kamera';
					cameraBtn.disabled = false;
				}
			});
			container.appendChild(cancelBtn);

      this._stopCamera();
      const cameraBtn = document.getElementById('camera-btn');
      if (cameraBtn) cameraBtn.textContent = 'Foto Ulang';
    }, 'image/png');
  }

  async destroy() {
    this._stopCamera();
    if (this.map?.map) {
      this.map.map.remove();
      this.map = null;
    }
    this.marker = null;
  }
}

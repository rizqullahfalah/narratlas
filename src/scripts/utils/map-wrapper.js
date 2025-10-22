// src/scripts/utils/map-wrapper.js

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export default class MapWrapper {
  constructor(selector, options = {}) {
    this.selector = selector;
    this.options = Object.assign({ zoom: 5, center: [-6.2, 106.8] }, options);
    this.map = null;
    this.tileLayers = {};
  }

  async build() {
    const el = typeof this.selector === 'string'
      ? document.getElementById(this.selector) || document.querySelector(this.selector)
      : this.selector;

    if (!el) {
      console.warn(`Map container not found: ${this.selector}`);
      return null;
    }

    // Hapus map lama kalau ada
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    if (el._leaflet_id) {
      el._leaflet_id = null;
    }

    this.map = L.map(el, {
      zoom: this.options.zoom,
      center: this.options.center,
      keyboard: true,
      tap: true,
    });

    el._leaflet_map = this.map;

    // Tile Layer OpenStreetMap (default)
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    // Tile Layer Stadia Maps
    const stadia = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', { 
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
    });

    // Tile Layer Topo Map
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: © <a href="https://opentopomap.org">OpenTopoMap</a>',
    });

    // Tile Layer Carto Light
    const cartoLight = L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    });

    // Tile Layer Carto Dark
    const cartoDark = L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    });

    // Tile Layer Carto Voyager
    const cartoVoyager = L.tileLayer('https://cartodb-basemaps-a.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    });

    // Tile Layer Esri WorldStreetMap
    const esri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &copy; OpenStreetMap contributors',
    });

    // Simpan semua tileLayers
    this.tileLayers = {
      'OpenStreetMap': osm,
      'Stadia Smooth': stadia,
      'Topo Map': topo,
      'Carto Light': cartoLight,
      'Carto Dark': cartoDark,
      'Carto Voyager': cartoVoyager,
      'Esri WorldStreetMap': esri,
    };

    // Tambahkan kontrol layer
    L.control.layers(this.tileLayers).addTo(this.map);

    return this;
  }

  addMarker(latlng, options = {}, popupContent = '') {
    if (!this.map) {
      console.warn('Map belum siap, marker tidak ditambahkan');
      return null;
    }
    const marker = L.marker(latlng, options).addTo(this.map);
    if (popupContent) marker.bindPopup(popupContent);
    return marker;
  }

  addMapEventListener(eventName, fn) {
    this.map.on(eventName, fn);
  }

  changeCamera(latlng, zoom = null) {
    if (!this.map) {
      console.warn('Map belum siap saat changeCamera dipanggil');
      return;
    }
    if (zoom) {
      this.map.setView(latlng, zoom);
    } else {
      this.map.setView(latlng);
    }
  }

  getCenter() {
    const c = this.map.getCenter();
    return { latitude: c.lat, longitude: c.lng };
  }
}

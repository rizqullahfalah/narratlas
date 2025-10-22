// src/scripts/utils/animations.js

import { animate, stagger } from 'animejs';

function prefersReducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function safeAnimate(target, opts) {
  if (prefersReducedMotion()) return null;

  if (typeof target === "string") {
    if (!document.querySelector(target)) return null;
  } else if (target instanceof Element) {
    if (!target) return null;
  } else if (NodeList && NodeList.prototype.isPrototypeOf(target) && target.length === 0) {
    return null;
  }

  try {
    return animate(target, opts);
  } catch (err) {
    console.warn('safeAnimate error:', err);
    return null;
  }
}

const Animations = {
  hero() {
    safeAnimate('.hero h1, .hero p, .hero .btn', {
      translateY: [28, 0],
      opacity: [0, 1],
      delay: stagger(160),
      duration: 900,
      easing: 'easeOutExpo'
    });
  },

  pageTitle(selector = 'main h1', options = {}) {
    if (prefersReducedMotion()) return null;
    const { delay = 120, duration = 700 } = options;

    return safeAnimate(selector, {
      translateY: [18, 0],
      opacity: [0, 1],
      letterSpacing: ['-0.04em', '0em'],
      delay: stagger(60, { start: delay }),
      duration,
      easing: 'easeOutCubic'
    });
  },

  brandLogo(selector = '.brand-name') {
    if (prefersReducedMotion()) return null;
    const el = document.querySelector(selector);
    if (!el) return null;

    if (!el.dataset.animated) {
      const text = el.textContent.trim();
      el.setAttribute('aria-label', text);

      el.innerHTML = '';

      [...text].forEach(ch => {
        const span = document.createElement('span');
        span.className = 'brand-letter';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        el.appendChild(span);
      });

      el.dataset.animated = 'true';
    }
    return safeAnimate(`${selector} .brand-letter`, {
      translateY: [18, 0],
      opacity: [0, 1],
      delay: stagger(35),
      duration: 750,
      easing: 'easeOutCubic'
    });
  },

  storyList() {
    safeAnimate('.story-card', {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: stagger(150, { start: 300 }),
      duration: 800,
      easing: 'easeOutCubic'
    });
  },

  form() {
    safeAnimate('form .form-control, form .form-buttons', {
      translateX: [-40, 0],
      opacity: [0, 1],
      delay: stagger(140, { start: 150 }),
      duration: 700,
      easing: 'easeOutExpo'
    });
  },

  cameraFlash() {
    if (prefersReducedMotion()) return null;
    const flash = document.createElement('div');
    flash.className = 'flash';
    document.body.appendChild(flash);

    Object.assign(flash.style, {
      position: 'fixed',
      inset: '0',
      background: '#fff',
      opacity: 0,
      zIndex: 9999,
      pointerEvents: 'none'
    });

    const anim = safeAnimate(flash, {
      opacity: [0, 1, 0],
      duration: 700,
      easing: 'easeInOutQuad'
    });

    if (anim?.finished) {
      anim.finished.then(() => flash.remove());
    } else {
      setTimeout(() => flash.remove(), 700);
    }
  },

  about() {
    safeAnimate('.about-page p', {
      translateY: [20, 0],
      opacity: [0, 1],
      delay: stagger(200, { start: 200 }),
      duration: 800,
      easing: 'easeOutCubic'
    });

    safeAnimate('.about-page .about-highlight', {
      translateX: [40, 0],
      opacity: [0, 1],
      duration: 900,
      delay: 600,
      easing: 'easeOutExpo'
    });

    safeAnimate('.about-page .closing-note', {
      opacity: [0, 1],
      scale: [0.96, 1],
      duration: 800,
      delay: 1000,
      easing: 'easeOutQuad'
    });
  },

  mapPage() {
    if (prefersReducedMotion()) return null;

    safeAnimate('.map-page h1, .map-page p, .map-page .page-desc', {
      opacity: [0, 1],
      translateY: [14, 0],
      delay: stagger(140, { start: 160 }),
      duration: 700,
      easing: 'easeOutCubic'
    });

    safeAnimate('.map-page .list .story-card, .map-page .story-list .story-card', {
      opacity: [0, 1],
      translateX: [-18, 0],
      delay: stagger(90, { start: 400 }),
      duration: 600,
      easing: 'easeOutQuad'
    });

    safeAnimate('.map-page #map, .map-page .map', {
      opacity: [0, 1],
      scale: [0.995, 1],
      duration: 500,
      easing: 'easeOutQuad'
    });
  },

  particlesElegantNav(selector = '.main-header', options = {}) {
    if (prefersReducedMotion()) return null;

    const { 
      count = 35, 
      size = [4, 14], 
      colors = ['#3399ff', '#9966ff'],
      baseDuration = 12000
    } = options;

    const parent = document.querySelector(selector);
    if (!parent) return;

    // Pastikan parent bisa jadi anchor positioning
    if (getComputedStyle(parent).position === 'static') {
      parent.style.position = 'relative';
    }

    // Cek apakah sudah ada container sebelumnya
    let container = parent.querySelector('.particle-nav-container');
    if (container) {
      return;
    }

    container = document.createElement('div');
    container.className = 'particle-nav-container';
    Object.assign(container.style, {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      zIndex: -1,
      pointerEvents: 'none',
    });
    parent.appendChild(container);

    for (let i = 0; i < count; i++) {
      const s = Math.random() * (size[1] - size[0]) + size[0];
      const particle = document.createElement('span');
      Object.assign(particle.style, {
        position: 'absolute',
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        width: `${s}px`,
        height: `${s}px`,
        borderRadius: '50%',
        background: colors[Math.floor(Math.random() * colors.length)],
        opacity: (0.1 + Math.random() * 0.15).toFixed(2),
        filter: 'blur(3px)',
      });
      container.appendChild(particle);

      const duration = baseDuration + Math.random() * 8000;

      safeAnimate(particle, {
        translateX: [0, (Math.random() - 0.5) * (s < 8 ? 120 : 60)],
        translateY: [0, (Math.random() - 0.5) * (s < 8 ? 120 : 60)],
        scale: [1, 1.2],
        opacity: {
          value: [0.15, 0.35],
          duration: duration * 0.8,
          direction: 'alternate'
        },
        direction: 'alternate',
        loop: true,
        duration: baseDuration * (0.6 + Math.random() * 0.8),
        easing: 'easeInOutSine'
      });
    }
  }
};

export default Animations;

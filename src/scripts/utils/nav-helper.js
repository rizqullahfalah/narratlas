// src/scripts/utils/nav-helper.js

export default function setActiveNav(route) {
  const navLinks = document.querySelectorAll('#nav-list a');
  const header = document.querySelector('#site-header');

  if (route === '/login' || route === '/register') {
    if (header) header.style.display = 'none';
  } else {
    if (header) header.style.display = '';
  }

  navLinks.forEach(link => link.classList.remove('active'));

  const normalize = (path) => {
    if (!path) return '/';
    return path.replace(/^#/, '').replace(/\/$/, '');
  };

  const cleanRoute = normalize(route);

  navLinks.forEach(link => {
    const linkRoute = normalize(link.getAttribute('href'));
    if (linkRoute === cleanRoute) {
      link.classList.add('active');
      console.log("✅ Match ->", linkRoute);
    }
  });
}

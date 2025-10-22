//src/scripts/routes/url-parser.js

function extractPathnameSegments(path) {
  const splitUrl = path.split('/');

  return {
    resource: splitUrl[1] || null,
    id: splitUrl[2] || null,
  };
}

function constructRouteFromSegments(pathSegments) {
  let pathname = '';

  if (pathSegments.resource) {
    pathname = pathname.concat(`/${pathSegments.resource}`);
  }

  if (pathSegments.id) {
    pathname = pathname.concat('/:id');
  }

  return pathname || '/';
}

// Ambil pathname aktif dari hash
export function getActivePathname() {
  return location.hash.replace('#', '') || '/';
}

// Hasilkan route string
export function getActiveRoute() {
  const pathname = getActivePathname();
  const urlSegments = extractPathnameSegments(pathname);
  return constructRouteFromSegments(urlSegments);
}

// Pecah pathname jadi resource + id
export function parseActivePathname() {
  const pathname = getActivePathname();
  return extractPathnameSegments(pathname);
}

// Buat route dari pathname
export function getRoute(pathname) {
  const urlSegments = extractPathnameSegments(pathname);
  return constructRouteFromSegments(urlSegments);
}

// Pecah pathname jadi segmen
export function parsePathname(pathname) {
  return extractPathnameSegments(pathname);
}

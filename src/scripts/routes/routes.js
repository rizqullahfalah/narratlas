// src/scripts/routes/routes.js

import HomePage from '../pages/home/home-page';
import LoginPage from '../pages/login/login-page';
import AboutPage from '../pages/about/about-page';
import MapPage from '../pages/map/map-page';
import NewPage from '../pages/new/new-page';
import RegisterPage from '../pages/register/register-page';
import SavedPage from '../pages/saved/saved-page';
import { getAccessToken } from '../utils/auth';

// RootPage bukan instance, tapi class wrapper
class RootPage {
  async render() {
    const PageClass = getAccessToken() ? HomePage : LoginPage;
    const page = new PageClass();
    return page.render();
  }

  async afterRender() {
    const PageClass = getAccessToken() ? HomePage : LoginPage;
    const page = new PageClass();
    if (page.afterRender) await page.afterRender();
  }
}

const routes = {
  '/': RootPage,
  '/home': HomePage,
  '/map': MapPage,
  '/new': NewPage,
  '/about': AboutPage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/saved': SavedPage,
};

export default routes;

// src/scripts/pages/about-page.js

import Animations from '../../utils/animations.js';

export default class AboutPage {
  async render() {
    return `
      <main id="main-content" class="container about-page">
        <h1>Tentang NarrAtlas</h1>
        
        <p>
          <strong>NarrAtlas</strong> atau StoryMap adalah aplikasi web modern untuk <em>menemukan</em>, 
          <em>membagikan</em>, dan <em>menjelajahi</em> cerita yang bisa terhubung dengan lokasi.  
          Dengan tampilan peta interaktif bernuansa biru yang elegan, 
          pengguna dapat melihat pengalaman orang lain secara visual dan kontekstual.
        </p>

        <p>
          NarrAtlas hadir dengan semangat untuk menghubungkan cerita dengan tempat, 
          sehingga setiap momen tidak hanya menjadi teks biasa, tetapi juga bagian dari 
          peta perjalanan kolektif. 
          Mulai dari catatan pribadi hingga pengalaman menarik, semuanya bisa 
          tersimpan rapi dalam satu platform.
        </p>

        <section class="about-highlight profile-section" aria-labelledby="about-author">
          <div class="profile-grid">
            <img 
              src="images/profile.jpg" 
              alt="Foto Rizqullah Falah Mahendra" 
              class="profile-photo"
              tabindex="0"
            />
            <div>
              <h2 id="about-author">Pembuat</h2>
              <p>
                NarrAtlas dikembangkan oleh 
                <strong>Rizqullah Falah Mahendra</strong>.  
                Proyek ini dirancang untuk membantu orang saling berbagi pengalaman 
                melalui cerita, sekaligus menjadi wadah untuk mengasah kemampuan 
                dalam <em>pengembangan web modern</em> yang elegan, profesional, dan mudah diakses.
              </p>
            </div>
          </div>
        </section>

        <p class="closing-note">
          Semoga <strong>NarrAtlas</strong> bermanfaat bagi banyak orang, 
          dan dapat menjadi inspirasi untuk terus belajar, berbagi, serta berkarya. 🚀
        </p>
      </main>
    `;
  }

  async afterRender() {
    Animations.pageTitle();
    Animations.about();
  }
}

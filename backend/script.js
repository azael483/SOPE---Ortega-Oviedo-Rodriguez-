async function cargarEventos() {

  try {

    const response = await fetch(
      'http://localhost:3001/api/eventos'
    );

    const json = await response.json();

    const eventos = json.data;

    console.log(eventos);

    /* HERO */

    if(eventos.length > 0){

      const hero = eventos[0];

      document.querySelector('.hero-img').src =
        hero.Imagen_Evento;

      document.querySelector('.hero-subtitle').innerHTML =
        hero.Nombre_Artista;

      document.querySelector('.hero-title').innerHTML =
        hero.Nombre_Evento;

      document.querySelector('.btn-tickets').href =
        `comprar_boleto.html?id=${hero.ID_Evento}`;

    }

    /* GRID EVENTOS */

    const grid = document.getElementById('events-grid');

    grid.innerHTML = eventos.map(e => `

      <div class="event-card">

        <img src="${e.Imagen_Evento}" />

        <div class="card-overlay">

          <p class="card-category">
            Música · Evento
          </p>

          <h3 class="card-title">
            ${e.Nombre_Evento}
          </h3>

          <p class="card-meta">

            ${new Date(e.Fecha_Evento_Ini)
              .toLocaleDateString('es-MX')}

            ·

            ${e.Ubicacion}

          </p>

        </div>

        <a
          href="comprar_boleto.html?id=${e.ID_Evento}"
          class="card-btn">

          Ver Boletos

        </a>

      </div>

    `).join('');

    /* DESTACADOS */

    const destacados = eventos.slice(0,3);

    const featured =
      document.getElementById('featured-grid');

    if(destacados.length >= 3){

      featured.innerHTML = `

        <div class="featured-main">

          <img src="${destacados[0].Imagen_Evento}" />

          <div class="card-overlay">

            <p class="card-category">
              ${destacados[0].Nombre_Artista}
            </p>

            <h3 class="card-title"
                style="font-size:2.4rem;">

              ${destacados[0].Nombre_Evento}

            </h3>

            <p class="card-meta">
              ${destacados[0].Ubicacion}
            </p>

          </div>

        </div>

        <div class="featured-side">

          ${destacados.slice(1).map(e => `

            <div class="featured-side-item">

              <img src="${e.Imagen_Evento}" />

              <div class="card-overlay">

                <p class="card-category">
                  ${e.Nombre_Artista}
                </p>

                <h3 class="card-title">
                  ${e.Nombre_Evento}
                </h3>

                <p class="card-meta">
                  ${e.Ubicacion}
                </p>

              </div>

            </div>

          `).join('')}

        </div>

      `;

    }

  } catch(error) {

    console.error(error);

  }

}

cargarEventos();


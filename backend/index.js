/**
 * Carga los eventos desde el backend y renderiza:
 * - Hero principal (primer evento)
 * - Grid de todos los eventos
 * - Sección de eventos destacados (primeros 3)
 * 
 * @async
 * @function cargarEventos
 * @returns {Promise<void>}
 * @throws {Error} Si falla la petición fetch o el parseo de JSON
 * 
 * @description
 * Esta función se ejecuta al cargar el DOM.
 * Llama a los siguientes endpoints:
 * - GET /api/eventos      → Obtiene la lista de eventos (debe incluir ID_Evento, Nombre_Evento, Nombre_Artista, Ubicacion, Fecha_Evento_Ini)
 * - GET /api/eventos/imagen/{id} → Se usa para cada imagen de evento (src de <img>)
 * 
 * Los datos esperados de /api/eventos deben tener la estructura:
 * {
 *   success: boolean,
 *   data: Array<{
 *     ID_Evento: number,
 *     Nombre_Evento: string,
 *     Nombre_Artista?: string,
 *     Ubicacion?: string,
 *     Fecha_Evento_Ini: string (ISO date)
 *   }>
 * }
 * 
 * Si no hay eventos, la función retorna temprano sin modificar el DOM.
 * El primer evento se usa como héroe principal (imagen, artista, título y enlace de compra).
 * Los eventos se muestran en una cuadrícula (#events-grid).
 * Los tres primeros eventos (si hay al menos 3) se muestran en la sección destacada (#featured-grid).
 */
async function cargarEventos() {
  try {
    // 1. Obtener eventos desde la API
    const response = await fetch('http://localhost:3001/api/eventos');
    const json = await response.json();
    console.log(json); // Para depuración

    const eventos = json.data;

    // Si no hay eventos, no renderizar nada
    if (!eventos || eventos.length === 0) {
      return;
    }

    /* ========== SECCIÓN HERO (primer evento) ========== */
    const hero = eventos[0];

    // Imagen del héroe (endpoint de imagen)
    document.querySelector('.hero-img').src =
      `http://localhost:3001/api/eventos/imagen/${hero.ID_Evento}`;

    // Nombre del artista (subtítulo)
    document.querySelector('.hero-subtitle').innerHTML =
      hero.Nombre_Artista || '';

    // Título del evento
    document.querySelector('.hero-title').innerHTML =
      hero.Nombre_Evento || '';

    // Enlace "Comprar boletos" redirige a comprar_boleto.html con el ID del evento
    document.querySelector('.btn-tickets').href =
      `comprar_boleto.html?id=${hero.ID_Evento}`;

    /* ========== GRID DE TODOS LOS EVENTOS ========== */
    const grid = document.getElementById('events-grid');

    grid.innerHTML = eventos.map(e => `
      <div class="event-card">
        <img src="http://localhost:3001/api/eventos/imagen/${e.ID_Evento}" />
        <div class="card-overlay">
          <p class="card-category">Música · Evento</p>
          <h3 class="card-title">${e.Nombre_Evento}</h3>
          <p class="card-meta">
            ${new Date(e.Fecha_Evento_Ini).toLocaleDateString('es-MX')}
            · ${e.Ubicacion || ''}
          </p>
        </div>
        <a href="comprar_boleto.html?id=${e.ID_Evento}" class="card-btn">
          Ver Boletos
        </a>
      </div>
    `).join('');

    /* ========== EVENTOS DESTACADOS (primeros 3) ========== */
    const destacados = eventos.slice(0, 3);
    const featured = document.getElementById('featured-grid');

    if (destacados.length >= 3) {
      featured.innerHTML = `
        <div class="featured-main">
          <img src="http://localhost:3001/api/eventos/imagen/${destacados[0].ID_Evento}" />
          <div class="card-overlay">
            <p class="card-category">${destacados[0].Nombre_Artista}</p>
            <h3 class="card-title" style="font-size:2.4rem;">${destacados[0].Nombre_Evento}</h3>
            <p class="card-meta">${destacados[0].Ubicacion}</p>
          </div>
        </div>
        <div class="featured-side">
          ${destacados.slice(1).map(e => `
            <div class="featured-side-item">
              <img src="http://localhost:3001/api/eventos/imagen/${e.ID_Evento}" />
              <div class="card-overlay">
                <p class="card-category">${e.Nombre_Artista}</p>
                <h3 class="card-title">${e.Nombre_Evento}</h3>
                <p class="card-meta">${e.Ubicacion}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch (error) {
    console.error('Error cargando eventos:', error);
  }
}

// Se ejecuta cuando el DOM está listo
document.addEventListener('DOMContentLoaded', cargarEventos);
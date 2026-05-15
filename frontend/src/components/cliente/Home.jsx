import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/home.css';

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const response = await api.get('/eventos');
        setEventos(response.data.data || []);
      } catch (error) {
        console.error('Error cargando eventos:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarEventos();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) return <div className="loading">Cargando eventos...</div>;
  if (!eventos.length) return <div className="no-events">No hay eventos disponibles</div>;

  const hero = eventos[0];
  const gridEventos = eventos;
  const destacados = eventos.slice(0, 3);

  return (
    <>
      <header>
        <Link to="/" className="logo">
          <span className="logo-text">SOPEMASTER</span>
          <span className="logo-icon">👆</span>
        </Link>
        <nav>
          <Link to="/ver-eventos">Mis eventos ›</Link>
          <a href="#acerca">Acerca de Nosotros ›</a>
          {user ? (
            <button onClick={handleLogout} className="btn-signin">log in</button>
          ) : (
            <Link to="/login" className="btn-signin">log in</Link>
          )}
        </nav>
      </header>

      <div className="search-bar">
        <div className="search-field">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <input type="text" placeholder="Ubicación" />
        </div>
        <div className="search-field">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <input type="text" placeholder="Fecha" />
        </div>
        <div className="search-field">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Buscar Artista, Evento, Inmueble" />
        </div>
      </div>

      <section className="hero">
        <img className="hero-img" src={`/api/eventos/imagen/${hero.ID_Evento}`} alt={hero.Nombre_Evento} />
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="hero-subtitle">{hero.Nombre_Artista || ''}</p>
          <h1 className="hero-title">{hero.Nombre_Evento}</h1>
        </div>
        <Link to={`/comprar-boleto/${hero.ID_Evento}`} className="btn-tickets">
          Ver Boletos
        </Link>
      </section>

      <div className="section-label">
        <h2>Eventos Próximos</h2>
        <div className="line"></div>
      </div>
      <div className="events-grid">
        {gridEventos.map(evento => (
          <div className="event-card" key={evento.ID_Evento}>
            <img src={`/api/eventos/imagen/${evento.ID_Evento}`} alt={evento.Nombre_Evento} />
            <div className="card-overlay">
              <p className="card-category">Música · Evento</p>
              <h3 className="card-title">{evento.Nombre_Evento}</h3>
              <p className="card-meta">
                {new Date(evento.Fecha_Evento_Ini).toLocaleDateString('es-MX')}
                · {evento.Ubicacion || ''}
              </p>
            </div>
            <Link to={`/comprar-boleto/${evento.ID_Evento}`} className="card-btn">
              Ver Boletos
            </Link>
          </div>
        ))}
      </div>

      <div className="band">
        <span className="band-item">Conciertos</span>
        <span className="band-sep">✦</span>
        <span className="band-item">Teatro</span>
        <span className="band-sep">✦</span>
        <span className="band-item">Arte y Cultura</span>
        <span className="band-sep">✦</span>
      </div>

      {destacados.length >= 3 && (
        <div className="dark-section">
          <div className="section-label">
            <h2>Eventos Destacados</h2>
            <div className="line"></div>
          </div>
          <div className="featured-grid">
            <div className="featured-main">
              <img src={`/api/eventos/imagen/${destacados[0].ID_Evento}`} alt={destacados[0].Nombre_Evento} />
              <div className="card-overlay">
                <p className="card-category">{destacados[0].Nombre_Artista}</p>
                <h3 className="card-title" style={{ fontSize: '2.4rem' }}>{destacados[0].Nombre_Evento}</h3>
                <p className="card-meta">{destacados[0].Ubicacion}</p>
              </div>
            </div>
            <div className="featured-side">
              {destacados.slice(1).map(evento => (
                <div className="featured-side-item" key={evento.ID_Evento}>
                  <img src={`/api/eventos/imagen/${evento.ID_Evento}`} alt={evento.Nombre_Evento} />
                  <div className="card-overlay">
                    <p className="card-category">{evento.Nombre_Artista}</p>
                    <h3 className="card-title">{evento.Nombre_Evento}</h3>
                    <p className="card-meta">{evento.Ubicacion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer id="acerca">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="logo-text" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '2px' }}>
              ACERCA DE NOSOTROS
            </span>
            <p>
              Sopemaster es la plataforma líder de venta de boletos en todo México. Conectamos a artistas,
              promotores y fans para crear experiencias inolvidables. Compra tus boletos de forma
              segura, rápida y sin complicaciones.
            </p>
          </div>
          <div className="footer-col">
            <h4>Contacto</h4>
            <div className="contact-item"><span>📍</span> Cancún, Quintana Roo, México</div>
            <div className="contact-item"><span>📧</span> Boletoscoquetos@sopemaster.mx</div>
            <div className="contact-item"><span>📞</span> +52 998 000 0000</div>
            <div className="contact-item"><span>🕐</span> Lun – Vie, 9 am – 6 pm</div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>2025 Sopemaster. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function VerEventos() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const res = await api.get('/eventos');
        setEventos(res.data.data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    cargarEventos();
  }, []);

  if (loading) return <div className="empty-state">Cargando eventos...</div>;
  if (!eventos.length) return <div className="empty-state">No hay eventos disponibles</div>;

  return (
    <div>
      <h2>Todos los eventos</h2>
      <div className="events-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px,1fr))', gap: '20px', marginTop: '20px' }}>
        {eventos.map(evento => (
          <div key={evento.ID_Evento} className="event-card" style={{ background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
            <img src={`/api/eventos/imagen/${evento.ID_Evento}`} alt={evento.Nombre_Evento} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            <div style={{ padding: '15px' }}>
              <h3>{evento.Nombre_Evento}</h3>
              <p>{evento.Ubicacion}</p>
              <p>{new Date(evento.Fecha_Evento_Ini).toLocaleDateString()}</p>
              <Link to={`/comprar-boleto/${evento.ID_Evento}`} className="btn-comprar" style={{ display: 'inline-block', marginTop: '10px', textAlign: 'center' }}>
                Ver boletos
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
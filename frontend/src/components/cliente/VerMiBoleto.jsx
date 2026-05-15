import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function VerMiBoleto() {
  const { user } = useAuth();
  const [boletos, setBoletos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Solo clientes autenticados pueden ver sus boletos
    if (!user || user.rol !== 'cliente') return;
    const cargarBoletos = async () => {
      try {
        // TODO: Endpoint que devuelva los boletos del usuario logueado
        // Simulación: lista vacía
        setBoletos([]);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    cargarBoletos();
  }, [user]);

  if (!user) return <div className="empty-state">Inicia sesión para ver tus boletos</div>;
  if (loading) return <div className="empty-state">Cargando...</div>;
  if (boletos.length === 0) return <div className="empty-state">No tienes boletos comprados aún.</div>;

  return (
    <div>
      <h2>Mis boletos</h2>
      <div className="boletos-list">
        {boletos.map(boleto => (
          <div key={boleto.ID_Reserva} className="boleto-card" style={{ background: '#1a1a2e', padding: '15px', marginBottom: '15px', borderRadius: '12px' }}>
            <p><strong>Evento:</strong> {boleto.Nombre_Evento}</p>
            <p><strong>Asiento:</strong> {boleto.Asiento}</p>
            <p><strong>Fecha:</strong> {new Date(boleto.Fecha_Evento_Ini).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
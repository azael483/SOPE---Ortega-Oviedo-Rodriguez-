import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import '../../styles/empleado.css';

export default function EmpleadoPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [boletoId, setBoletoId] = useState('');
  const [resultado, setResultado] = useState('');
  const [loading, setLoading] = useState(true);

  // Redirigir si no es empleado (protección extra)
  useEffect(() => {
    if (user && user.rol !== 'empleado') {
      navigate('/');
    }
  }, [user, navigate]);

  // Cargar eventos al montar
  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const response = await api.get('/eventos');
        const data = response.data.data || [];
        // Agregar número aleatorio de "disponibles" (simulación)
        const eventosConDisponibles = data.map(e => ({
          ...e,
          disponibles: Math.floor(Math.random() * 300)
        }));
        setEventos(eventosConDisponibles);
      } catch (error) {
        console.error('Error cargando eventos:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarEventos();
  }, []);

  const handleValidarBoleto = async () => {
    if (!boletoId.trim()) {
      setResultado('Ingresa un ID de boleto');
      return;
    }
    // Aquí iría la lógica real de validación contra el backend
    // Por ahora es simulada como en el original
    setResultado(`Boleto ${boletoId} validado (simulado)`);
    // Limpiar input opcionalmente
    // setBoletoId('');
  };

  const handleLogout = () => {
    logout(); // El contexto ya limpia localStorage y redirige a login
  };

  if (loading) return <div className="loading">Cargando panel...</div>;

  return (
    <>
      <header>
        <div className="logo">SOPEMASTER 👆</div>
        <button className="logout" onClick={handleLogout}>CERRAR SESIÓN</button>
      </header>

      <section className="hero">
        <h1>PANEL EMPLEADO</h1>
        <p>Gestión operativa y validación de boletos</p>
      </section>

      <section className="container">
        <div className="card">
          <h2>VALIDAR BOLETO</h2>
          <input
            type="text"
            placeholder="ID DEL BOLETO"
            value={boletoId}
            onChange={(e) => setBoletoId(e.target.value)}
          />
          <button onClick={handleValidarBoleto}>VALIDAR ENTRADA</button>
          <p style={{ marginTop: '20px', fontWeight: '700' }}>{resultado}</p>
        </div>

        <div className="card">
          <h2>INVENTARIO EVENTOS</h2>
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Disponibles</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map(evento => (
                <tr key={evento.ID_Evento}>
                  <td>{evento.Nombre_Evento}</td>
                  <td>{evento.disponibles}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
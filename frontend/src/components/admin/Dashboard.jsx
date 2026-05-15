import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import EventosTable from './EventosTable';
import CrearEventoModal from './CrearEventoModal';
import EditarEventoModal from './EditarEventoModal';
import '../../styles/admin.css'; // los estilos CSS

export default function Dashboard() {
  const { logout } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [dashboard, setDashboard] = useState({ eventosActivos: 0, totalBoletos: 0, ventasTotales: 0 });
  const [selectedEventoId, setSelectedEventoId] = useState(null);
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [eventoAEditar, setEventoAEditar] = useState(null);

  // Cargar datos iniciales
  const cargarDatos = async () => {
    try {
      const [eventosRes, dashRes] = await Promise.all([
        api.get('/eventos'),
        api.get('/admin/dashboard')
      ]);
      setEventos(eventosRes.data.data);
      setDashboard(dashRes.data.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleSeleccionarEvento = (id) => {
    setSelectedEventoId(id);
  };

  const handleEditar = async () => {
    if (!selectedEventoId) return;
    const evento = eventos.find(e => e.ID_Evento === selectedEventoId);
    if (evento) {
      setEventoAEditar(evento);
      setShowEditarModal(true);
    }
  };

  const handleEliminar = async () => {
    if (!selectedEventoId) return;
    const confirmar = window.confirm('¿Estás seguro de eliminar este evento?\nSe moverá a histórico y se perderán los boletos no vendidos.');
    if (!confirmar) return;
    try {
      const res = await api.delete(`/admin/eliminar-evento/${selectedEventoId}`);
      if (res.data.success) {
        alert('Evento eliminado correctamente');
        setSelectedEventoId(null);
        cargarDatos();
      } else {
        alert('Error: ' + res.data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const handleCrearExito = () => {
    setShowCrearModal(false);
    cargarDatos();
  };

  const handleEditarExito = () => {
    setShowEditarModal(false);
    setEventoAEditar(null);
    cargarDatos();
  };

  return (
    <div>
      <header className="admin-header">
        <div className="logo">SOPEMASTER 👆</div>
        <button className="logout" onClick={logout}>CERRAR SESIÓN</button>
      </header>

      <section className="hero">
        <h1>PANEL ADMINISTRADOR</h1>
        <p>Control total de eventos, ventas y sistema</p>
      </section>

      <section className="cards">
        <div className="card">
          <h2>VENTAS TOTALES</h2>
          <div className="metric">${dashboard.ventasTotales?.toLocaleString('es-MX') || 0}</div>
        </div>
        <div className="card">
          <h2>BOLETOS VENDIDOS</h2>
          <div className="metric">{dashboard.totalBoletos}</div>
        </div>
        <div className="card">
          <h2>EVENTOS ACTIVOS</h2>
          <div className="metric">{dashboard.eventosActivos}</div>
        </div>
      </section>

      <section className="actions">
        <h2>CONSOLA DE CONTROL</h2>
        <div className="buttons">
          <button onClick={() => setShowCrearModal(true)}>CREAR EVENTO</button>
          <button onClick={handleEditar} disabled={!selectedEventoId}>EDITAR EVENTO</button>
          <button onClick={handleEliminar} disabled={!selectedEventoId}>ELIMINAR EVENTO</button>
        </div>
      </section>

      <section style={{ padding: '40px' }}>
        <div className="card">
          <h2>EVENTOS REGISTRADOS</h2>
          <EventosTable eventos={eventos} onSelect={handleSeleccionarEvento} selectedId={selectedEventoId} />
        </div>
      </section>

      {showCrearModal && <CrearEventoModal onClose={() => setShowCrearModal(false)} onSuccess={handleCrearExito} />}
      {showEditarModal && eventoAEditar && (
        <EditarEventoModal evento={eventoAEditar} onClose={() => setShowEditarModal(false)} onSuccess={handleEditarExito} />
      )}
    </div>
  );
}
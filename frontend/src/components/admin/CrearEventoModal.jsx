import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function CrearEventoModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', fecha_ini: '', fecha_fin: '',
    num_filas: 10, asientos_x_fila: 20, costo_produccion: 0,
    tipo_reembolso: '', estatus: '', id_artista: '', id_ubicacion: ''
  });
  const [artistas, setArtistas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [tiposReembolso, setTiposReembolso] = useState([]);
  const [estatusList, setEstatusList] = useState([]);

  useEffect(() => {
    const loadSelects = async () => {
      try {
        const [art, ub, tr, est] = await Promise.all([
          api.get('/admin/artistas'),
          api.get('/admin/ubicaciones'),
          api.get('/admin/tipos-reembolso'),
          api.get('/admin/estatus-eventos')
        ]);
        if (art.data.success) setArtistas(art.data.data);
        if (ub.data.success) setUbicaciones(ub.data.data);
        if (tr.data.success) setTiposReembolso(tr.data.data);
        if (est.data.success) setEstatusList(est.data.data);
      } catch (error) {
        console.error(error);
      }
    };
    loadSelects();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, imagen_base64: null };
    try {
      const res = await api.post('/admin/crear-evento', payload);
      if (res.data.success) {
        alert('Evento creado exitosamente');
        onSuccess();
      } else {
        alert('Error: ' + res.data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  return (
    <div className="modal" style={{ display: 'flex' }}>
      <div className="modal-content" style={{ width: '600px', maxHeight: '85vh', overflowY: 'auto' }}>
        <h2>Crear Evento</h2>
        <form onSubmit={handleSubmit}>
          <label>Nombre del Evento</label>
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />

          <label>Descripción</label>
          <textarea name="descripcion" rows="5" value={form.descripcion} onChange={handleChange} />

          <label>Fecha y hora de inicio</label>
          <input type="datetime-local" name="fecha_ini" value={form.fecha_ini} onChange={handleChange} required />

          <label>Fecha y hora de fin</label>
          <input type="datetime-local" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} required />

          <label>Número de filas</label>
          <input type="number" name="num_filas" value={form.num_filas} onChange={handleChange} min="1" required />

          <label>Asientos por fila</label>
          <input type="number" name="asientos_x_fila" value={form.asientos_x_fila} onChange={handleChange} min="1" required />

          <label>Costo de producción</label>
          <input type="number" name="costo_produccion" value={form.costo_produccion} onChange={handleChange} min="0" required />

          <label>Tipo de reembolso</label>
          <select name="tipo_reembolso" value={form.tipo_reembolso} onChange={handleChange} required>
            <option value="">Seleccione</option>
            {tiposReembolso.map(t => <option key={t.ID_Tipo_Reembolso} value={t.ID_Tipo_Reembolso}>{t.Nombre_Tipo_Reembolso}</option>)}
          </select>

          <label>Estatus del evento</label>
          <select name="estatus" value={form.estatus} onChange={handleChange} required>
            <option value="">Seleccione</option>
            {estatusList.map(e => <option key={e.ID_Estatus} value={e.ID_Estatus}>{e.Estatus}</option>)}
          </select>

          <label>Artista</label>
          <select name="id_artista" value={form.id_artista} onChange={handleChange} required>
            <option value="">Seleccione</option>
            {artistas.map(a => <option key={a.ID_Artista} value={a.ID_Artista}>{a.Nombre_Artista}</option>)}
          </select>

          <label>Ubicación</label>
          <select name="id_ubicacion" value={form.id_ubicacion} onChange={handleChange} required>
            <option value="">Seleccione</option>
            {ubicaciones.map(u => <option key={u.ID_Ubicacion} value={u.ID_Ubicacion}>{u.Ubicacion}</option>)}
          </select>

          <div className="modal-buttons">
            <button type="submit">Guardar</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function EditarEventoModal({ evento, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nombre: '', descripcion: '', fecha_ini: '', fecha_fin: '',
    num_filas: '', asientos_x_fila: '', costo_produccion: '',
    tipo_reembolso: '', estatus: '', id_artista: '', id_ubicacion: ''
  });
  const [artistas, setArtistas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [tiposReembolso, setTiposReembolso] = useState([]);
  const [estatusTodos, setEstatusTodos] = useState([]);

  useEffect(() => {
    // precargar datos del evento
    setForm({
      nombre: evento.Nombre_Evento || '',
      descripcion: evento.Descripcion_Evento || '',
      fecha_ini: evento.Fecha_Evento_Ini ? evento.Fecha_Evento_Ini.slice(0,16) : '',
      fecha_fin: evento.Fecha_Evento_Fin ? evento.Fecha_Evento_Fin.slice(0,16) : '',
      num_filas: evento.Num_Filas || '',
      asientos_x_fila: evento.Asientos_x_Fila || '',
      costo_produccion: evento.Costo_Produccion_Evento || '',
      tipo_reembolso: evento.Tipo_Reembolso || '',
      estatus: evento.Estatus_evento || '',
      id_artista: evento.ID_Artista || '',
      id_ubicacion: evento.ID_Ubicacion || ''
    });
  }, [evento]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [art, ub, tr, est] = await Promise.all([
          api.get('/admin/artistas'),
          api.get('/admin/ubicaciones'),
          api.get('/admin/tipos-reembolso'),
          api.get('/admin/estatus-todos')
        ]);
        if (art.data.success) setArtistas(art.data.data);
        if (ub.data.success) setUbicaciones(ub.data.data);
        if (tr.data.success) setTiposReembolso(tr.data.data);
        if (est.data.success) setEstatusTodos(est.data.data);
      } catch (error) {
        console.error(error);
      }
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, imagen_base64: null };
    try {
      const res = await api.put(`/admin/editar-evento/${evento.ID_Evento}`, payload);
      if (res.data.success) {
        alert('Evento actualizado correctamente');
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
        <h2>Editar Evento</h2>
        <form onSubmit={handleSubmit}>
          <label>Nombre del Evento</label>
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />

          <label>Descripción</label>
          <textarea name="descripcion" rows="4" value={form.descripcion} onChange={handleChange} />

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
            {estatusTodos.map(e => <option key={e.ID_Estatus} value={e.ID_Estatus}>{e.Estatus}</option>)}
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
            <button type="submit">Guardar Cambios</button>
            <button type="button" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
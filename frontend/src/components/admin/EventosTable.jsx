export default function EventosTable({ eventos, onSelect, selectedId }) {
  return (
    <table>
      <thead>
        <tr><th>Evento</th><th>Ubicación</th><th>Fecha</th><th>Estatus</th><th>Tipo Reembolso</th></tr>
      </thead>
      <tbody>
        {eventos.map(evento => (
          <tr
            key={evento.ID_Evento}
            className={selectedId === evento.ID_Evento ? 'seleccionado' : ''}
            onClick={() => onSelect(evento.ID_Evento)}
            style={{ cursor: 'pointer' }}
          >
            <td>{evento.Nombre_Evento}</td>
            <td>{evento.Ubicacion || evento.ID_Ubicacion}</td>
            <td>{new Date(evento.Fecha_Evento_Ini).toLocaleString()}</td>
            <td>{evento.Estatus || 'Sin estatus'}</td>
            <td>{evento.Nombre_Tipo_Reembolso || 'Sin tipo'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
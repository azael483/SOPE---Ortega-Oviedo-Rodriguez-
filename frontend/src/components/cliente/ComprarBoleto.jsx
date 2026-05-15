import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

const PRICE_NORMAL = 350;
const PRICE_VIP = 650;
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 12;
const VIP_ROWS = new Set(['A', 'B']);

// Simulación de asientos ocupados (debería venir del backend)
const OCCUPIED_SEATS = new Set([
  'A3','A4','A9',
  'B2','B5','B6','B10','B11',
  'C1','C7','C8',
  'D3','D4','D5','D9','D10',
  'E6','E7',
  'F2','F3','F11','F12',
  'G5','G6','G7','G8',
  'H1','H2','H10','H11','H12',
]);

export default function ComprarBoleto() {
  const { id } = useParams(); // id del evento
  const [evento, setEvento] = useState(null);
  const [selected, setSelected] = useState(new Map()); // Map<id, {row, num, price}>
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar datos del evento (simulado o desde API)
    const cargarEvento = async () => {
      try {
        // TODO: Obtener evento por ID desde el backend
        // Por ahora usamos datos estáticos
        setEvento({
          ID_Evento: id || 1,
          Nombre_Evento: "El principe de la cancion",
          Nombre_Artista: "José José",
          Fecha_Evento_Ini: "2026-03-14T20:30:00",
          Ubicacion: "Auditorio Nacional"
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    cargarEvento();
  }, [id]);

  const toggleSeat = (seatId, row, num, price, btnElement) => {
    if (OCCUPIED_SEATS.has(seatId)) return;

    const newSelected = new Map(selected);
    if (newSelected.has(seatId)) {
      newSelected.delete(seatId);
      btnElement?.classList.remove('selected');
      btnElement?.classList.add(VIP_ROWS.has(row) ? 'vip' : 'available');
    } else {
      newSelected.set(seatId, { row, num, price });
      btnElement?.classList.remove('available', 'vip');
      btnElement?.classList.add('selected');
    }
    setSelected(newSelected);
  };

  const removeSeat = (seatId) => {
    const entry = selected.get(seatId);
    if (!entry) return;
    const newSelected = new Map(selected);
    newSelected.delete(seatId);
    setSelected(newSelected);
    const btn = document.querySelector(`.seat[data-id="${seatId}"]`);
    if (btn) {
      btn.classList.remove('selected');
      btn.classList.add(VIP_ROWS.has(entry.row) ? 'vip' : 'available');
    }
  };

  const handleComprar = () => {
    if (selected.size === 0) return;
    const ids = [...selected.keys()].join(', ');
    const total = [...selected.values()].reduce((s, v) => s + v.price, 0);
    alert(`✅ Compra confirmada\nAsientos: ${ids}\nTotal: $${total.toLocaleString('es-MX')} MXN`);
    // Limpiar selección
    const newSelected = new Map();
    selected.forEach((_, seatId) => {
      const btn = document.querySelector(`.seat[data-id="${seatId}"]`);
      if (btn) {
        btn.classList.remove('selected');
        const row = seatId.charAt(0);
        btn.classList.add(VIP_ROWS.has(row) ? 'vip' : 'available');
      }
    });
    setSelected(newSelected);
  };

  if (loading) return <div className="empty-state">Cargando evento...</div>;
  if (!evento) return <div className="empty-state">Evento no encontrado</div>;

  const total = [...selected.values()].reduce((s, v) => s + v.price, 0);
  const fechaFormateada = new Date(evento.Fecha_Evento_Ini).toLocaleDateString('es-MX');
  const horaFormateada = new Date(evento.Fecha_Evento_Ini).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className="event-header">
        <div className="event-tag">{evento.Nombre_Artista}</div>
        <h2 className="event-title">{evento.Nombre_Evento}</h2>
        <div className="event-meta">
          <span>📅 {fechaFormateada}</span>
          <span>🕗 {horaFormateada}</span>
          <span>📍 {evento.Ubicacion}</span>
        </div>
      </div>

      <div className="stage-wrapper">
        <div className="stage">🎤 &nbsp; E S C E N A R I O &nbsp; 🎤</div>
      </div>

      <div className="legend">
        <div className="legend-item">
          <div className="legend-dot available"></div> Disponible
          <span className="price-badge normal">${PRICE_NORMAL}</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot vip"></div> VIP
          <span className="price-badge vip">${PRICE_VIP}</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot occupied"></div> Ocupado
        </div>
        <div className="legend-item">
          <div className="legend-dot selected"></div> Seleccionado
        </div>
      </div>

      <div className="seat-map" id="seatMap">
        {ROWS.map(row => (
          <div className="seat-row" key={row}>
            <span className="row-label">{row}</span>
            {Array.from({ length: SEATS_PER_ROW }, (_, i) => {
              const seatNum = i + 1;
              const seatId = `${row}${seatNum}`;
              const isOccupied = OCCUPIED_SEATS.has(seatId);
              const isVip = VIP_ROWS.has(row);
              const price = isVip ? PRICE_VIP : PRICE_NORMAL;
              const isSelected = selected.has(seatId);
              let seatClass = 'seat';
              if (isOccupied) seatClass += ' occupied';
              else if (isSelected) seatClass += ' selected';
              else if (isVip) seatClass += ' vip';
              else seatClass += ' available';
              return (
                <>
                  {seatNum === 7 && <div className="aisle" key={`aisle-${row}`}></div>}
                  <button
                    key={seatId}
                    className={seatClass}
                    data-id={seatId}
                    data-price={price}
                    title={isOccupied ? `Asiento ${seatId} — Ocupado` : `Asiento ${seatId} — $${price} MXN`}
                    onClick={(e) => toggleSeat(seatId, row, seatNum, price, e.currentTarget)}
                    disabled={isOccupied}
                  />
                </>
              );
            })}
          </div>
        ))}
      </div>

      <div className="summary-card">
        <p className="summary-title">Tu selección</p>
        <div className="selected-seats-list">
          {selected.size === 0 ? (
            <span className="empty-state">Ningún asiento seleccionado</span>
          ) : (
            Array.from(selected.entries()).map(([seatId, { row, num, price }]) => (
              <div className="seat-tag" key={seatId}>
                {seatId}
                <button onClick={() => removeSeat(seatId)}>×</button>
              </div>
            ))
          )}
        </div>
        <div className="summary-row">
          <span>Asientos seleccionados</span>
          <span>{selected.size}</span>
        </div>
        <div className="summary-row total">
          <span>Total</span>
          <span className="price-highlight">${total.toLocaleString('es-MX')} MXN</span>
        </div>
        <button className="btn-comprar" onClick={handleComprar} disabled={selected.size === 0}>
          Confirmar compra
        </button>
      </div>
    </>
  );
}
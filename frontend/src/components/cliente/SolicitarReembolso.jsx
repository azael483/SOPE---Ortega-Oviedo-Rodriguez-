import { useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function SolicitarReembolso() {
  const { user } = useAuth();
  const [boletoId, setBoletoId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!boletoId.trim()) {
      setMessage('Ingrese el ID del boleto');
      return;
    }
    setLoading(true);
    try {
      // TODO: Llamar al endpoint real de reembolso
      // const res = await api.post('/reembolso/solicitar', { boletoId });
      // Simulación
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage(`Solicitud de reembolso para el boleto ${boletoId} enviada. Revisa tu correo.`);
      setBoletoId('');
    } catch (error) {
      setMessage('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Solicitar reembolso</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="ID del boleto"
          value={boletoId}
          onChange={(e) => setBoletoId(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
        />
        <button type="submit" disabled={loading} className="btn-comprar" style={{ marginTop: 0 }}>
          {loading ? 'Procesando...' : 'Solicitar reembolso'}
        </button>
      </form>
      {message && <p style={{ marginTop: '20px', color: '#c084fc' }}>{message}</p>}
    </div>
  );
}
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (success) {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      if (usuario.rol === 'admin') navigate('/admin', { replace: true });
      else if (usuario.rol === 'empleado') navigate('/empleado', { replace: true });
      else navigate('/', { replace: true });
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="container">
      <div className="login-box">
        <Link to="/" className="back-btn">←</Link>
        <h1>LOG IN</h1>
        <form onSubmit={handleSubmit}>
          <label>USER</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <label>PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <a href="#" className="forgot">FORGOT PASSWORD?</a>
          <button type="submit">LOG IN →</button>
        </form>
        {error && <p id="msg" style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
      </div>
    </div>
  );
}
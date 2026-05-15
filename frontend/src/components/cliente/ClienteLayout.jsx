import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/cliente.css';

export default function ClienteLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <header>
        <h1>SOPEMASTER 👆</h1>
        {user ? (
          <button onClick={handleLogout} className="btn-inicio">Cerrar sesión</button>
        ) : (
          <NavLink to="/" className="btn-inicio">Inicio</NavLink>
        )}
      </header>
      <main className="container">
        <aside className="menu">
          <NavLink to="/comprar-boleto" className={({ isActive }) => isActive ? 'btnactivo' : 'btn'}>
            Comprar boleto
          </NavLink>
          <NavLink to="/solicitar-reembolso" className={({ isActive }) => isActive ? 'btnactivo' : 'btn'}>
            Solicitar reembolso
          </NavLink>
          <NavLink to="/ver-mi-boleto" className={({ isActive }) => isActive ? 'btnactivo' : 'btn'}>
            Ver mi boleto
          </NavLink>
          <NavLink to="/ver-eventos" className={({ isActive }) => isActive ? 'btnactivo' : 'btn'}>
            Ver eventos
          </NavLink>
        </aside>
        <section className="contenido">
          <Outlet />
        </section>
      </main>
    </>
  );
}
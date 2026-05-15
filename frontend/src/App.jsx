import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './components/Cliente/Home';
import Login from './components/Auth/Login';
import Dashboard from './components/Admin/Dashboard';
import EmpleadoPanel from './components/Empleado/EmpleadoPanel';
import ClienteLayout from './components/Cliente/ClienteLayout';
import ComprarBoleto from './components/Cliente/ComprarBoleto';
import SolicitarReembolso from './components/Cliente/SolicitarReembolso';
import VerEventos from './components/Cliente/VerEventos';
import VerMiBoleto from './components/Cliente/VerMiBoleto';
import './styles/cliente.css';
import './styles/admin.css';
import './styles/empleado.css';
import './styles/login.css';
import './styles/home.css';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return null; // o un spinner de carga
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.rol)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Rutas de cliente con layout */}
          <Route element={<ClienteLayout />}>
            <Route path="/comprar-boleto" element={<ComprarBoleto />} />
            <Route path="/comprar-boleto/:id" element={<ComprarBoleto />} />
            <Route path="/solicitar-reembolso" element={<SolicitarReembolso />} />
            <Route path="/ver-eventos" element={<VerEventos />} />
            <Route path="/ver-mi-boleto" element={<VerMiBoleto />} />
          </Route>

          {/* Rutas protegidas por rol */}
          <Route path="/admin" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/empleado" element={
            <PrivateRoute allowedRoles={['empleado']}>
              <EmpleadoPanel />
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
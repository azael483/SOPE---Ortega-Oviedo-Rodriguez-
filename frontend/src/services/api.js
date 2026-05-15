import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor opcional para agregar rol si lo necesitas
api.interceptors.request.use((config) => {
  const user = localStorage.getItem('usuario');
  if (user) {
    config.headers['X-User-Role'] = JSON.parse(user).rol;
  }
  return config;
});

export default api;
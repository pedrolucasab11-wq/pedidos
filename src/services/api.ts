import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3333',
});

// Injeta o token JWT em todas as requisições automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Tratamento global de erros de resposta:
// - 401/403 fora das telas de login/registro: sessão inválida ou expirada, limpa e redireciona.
// - Erro de rede (sem resposta do servidor): avisa o usuário de forma clara.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthPage = window.location.pathname === '/' || window.location.pathname === '/registro';

    if (!error.response) {
      toast.error('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      return Promise.reject(error);
    }

    if ((error.response.status === 401 || error.response.status === 403) && !isAuthPage) {
      const message = error.response.data?.message || 'Sua sessão expirou. Faça login novamente.';
      toast.error(message);
      localStorage.removeItem('token');
      localStorage.removeItem('sellerId');
      window.location.href = '/';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;


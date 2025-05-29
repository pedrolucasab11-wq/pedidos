import axios from 'axios';

const api = axios.create({
  baseURL: 'https://backend-pedidos-i1qd.onrender.com/',
});

export default api;

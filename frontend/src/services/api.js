// src/services/api.js - Axios instance
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000
});

// Response interceptor for global error handling
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('genesis_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

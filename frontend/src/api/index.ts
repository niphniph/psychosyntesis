import axios from 'axios';

// In development Vite proxies /api and /uploads to the backend (see vite.config.ts)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ADMIN_TOKEN_KEY = 'adminToken';

// Automatically inject the user JWT and the admin session token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (adminToken && config.headers) {
      config.headers['X-Admin-Token'] = adminToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

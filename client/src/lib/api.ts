import axios from 'axios';

const api = axios.create({
  baseURL: '', // Routed through Vite dev server proxy in development
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT bearer token into headers if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

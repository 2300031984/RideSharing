import axios from 'axios';

const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:8081") + "/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isMockToken = user?.token && user.token.startsWith('mock-token-');

    if (error.response?.status === 401 && !isMockToken) {
      // Token expired or invalid (and not a mock token)
      if (user?.token) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    // 🚀 DEMO MODE: If API is down, just return a fake success for common GETs if we have local data
    if (!error.response && isMockToken) {
        console.warn('🚀 Demo Mode: Backend unreachable, proceeding with local mock logic.');
        return Promise.resolve({ data: {} }); 
    }

    return Promise.reject(error);
  }
);

export default api;

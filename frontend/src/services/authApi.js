import apiClient from './api';

export const authApi = {
  // Public user registration (FARMER or BUYER)
  register: (payload) => apiClient.post('/api/auth/register', payload),

  // Public user login returning AuthResponse { token, type, userId, email, fullName, role }
  login: (credentials) => apiClient.post('/api/auth/login', credentials),

  // Current authenticated user details (GET /api/auth/me)
  getMe: () => apiClient.get('/api/auth/me'),

  // Logout session (POST /api/auth/logout)
  logout: () => apiClient.post('/api/auth/logout'),

  // System health check (GET /api/health)
  getHealth: () => apiClient.get('/api/health'),
};

export default authApi;

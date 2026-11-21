import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: inject JWT Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('agriconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle data unwrapping and auth expiry
apiClient.interceptors.response.use(
  (response) => {
    // Backend standard responses return ApiResponse { status, message, data }
    return response.data;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      // If 401 Unauthorized occurs on an authenticated route, clear stored auth
      if (status === 401 && localStorage.getItem('agriconnect_token')) {
        console.warn('Authentication token expired or rejected by server.');
        localStorage.removeItem('agriconnect_token');
        localStorage.removeItem('agriconnect_user');
        // Dispatch custom event so AuthContext can synchronize state
        window.dispatchEvent(new Event('agriconnect_auth_expired'));
      }

      // Extract sanitized message if provided by GlobalExceptionHandler
      const errorData = error.response.data;
      const message = errorData?.message || errorData?.error || 'A network or server error occurred.';
      return Promise.reject({
        status,
        message,
        errors: errorData?.errors || null,
        raw: errorData,
      });
    }
    return Promise.reject({
      status: 0,
      message: 'Unable to connect to AgriConnect backend server (http://localhost:8080). Please ensure backend is running.',
    });
  }
);

export default apiClient;

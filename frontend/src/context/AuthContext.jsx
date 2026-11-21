import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('agriconnect_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('agriconnect_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  // Synchronize authentication state on initial load
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('agriconnect_token');
      if (storedToken) {
        try {
          // Verify with backend GET /api/auth/me
          const meResponse = await authApi.getMe();
          // Backend returns UserResponse directly: { userId, fullName, email, phone, role, status, ... }
          const userData = meResponse;
          setUser(userData);
          localStorage.setItem('agriconnect_user', JSON.stringify(userData));
        } catch (err) {
          console.warn('Session verification failed:', err.message);
          logoutLocally();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    verifyAuth();

    // Listen for 401 token expiry event dispatched by api.js interceptor
    const handleExpired = () => logoutLocally();
    window.addEventListener('agriconnect_auth_expired', handleExpired);
    return () => window.removeEventListener('agriconnect_auth_expired', handleExpired);
  }, []);

  const login = async (credentials) => {
    // Calls POST /api/auth/login
    // Response is AuthResponse: { token, type, userId, email, fullName, role }
    const response = await authApi.login(credentials);
    const authToken = response.token;
    const authUser = {
      userId: response.userId,
      email: response.email,
      fullName: response.fullName,
      role: response.role,
    };

    localStorage.setItem('agriconnect_token', authToken);
    localStorage.setItem('agriconnect_user', JSON.stringify(authUser));

    setToken(authToken);
    setUser(authUser);

    return authUser;
  };

  const logoutLocally = () => {
    localStorage.removeItem('agriconnect_token');
    localStorage.removeItem('agriconnect_user');
    setToken(null);
    setUser(null);
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (err) {
      console.warn('Server logout error (proceeding with local cleanup):', err);
    } finally {
      logoutLocally();
    }
  };

  const role = user?.role || null;
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

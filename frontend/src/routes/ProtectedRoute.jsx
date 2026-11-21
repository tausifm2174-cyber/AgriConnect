import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Route protection guard for role-based access.
 * Note: Frontend route guard is a UI routing convenience;
 * Spring Security at the backend remains the authoritative security boundary.
 */
export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <LoadingSpinner message="Authenticating session..." size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required, ensure user holds the authorized role
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect cross-role attempts to their authorized dashboard
    if (role === 'FARMER') return <Navigate to="/farmer" replace />;
    if (role === 'BUYER') return <Navigate to="/buyer" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

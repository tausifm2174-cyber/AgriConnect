import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'var(--color-bg)',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-warning-bg)',
        color: 'var(--color-warning)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        <AlertTriangle size={32} />
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
        404 — Page Not Found
      </h1>

      <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', maxWidth: '440px', marginBottom: '2rem' }}>
        The requested page or resource could not be found. Please return to your portal dashboard or sign-in screen.
      </p>

      <Link to="/" className="btn btn-primary btn-lg">
        <Home size={20} />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFound;

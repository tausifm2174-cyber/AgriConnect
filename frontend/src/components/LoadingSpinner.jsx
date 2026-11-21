import React from 'react';

export const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  const sizeMap = {
    small: { spinner: '20px', border: '2px' },
    medium: { spinner: '36px', border: '3px' },
    large: { spinner: '54px', border: '4px' },
  };

  const { spinner, border } = sizeMap[size] || sizeMap.medium;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '0.875rem'
    }}>
      <div style={{
        width: spinner,
        height: spinner,
        border: `${border} solid var(--color-border)`,
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.75s linear infinite'
      }} />
      {message && (
        <span style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          fontWeight: 500
        }}>
          {message}
        </span>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;

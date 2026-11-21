import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export const ErrorMessage = ({ message, errors, onDismiss }) => {
  if (!message && (!errors || Object.keys(errors).length === 0)) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      backgroundColor: 'var(--color-danger-bg)',
      border: '1px solid var(--color-danger-border)',
      color: 'var(--color-danger)',
      borderRadius: 'var(--radius-md)',
      padding: '0.875rem 1rem',
      marginBottom: '1.25rem',
      fontSize: '0.875rem',
      lineHeight: 1.4
    }}>
      <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
      <div style={{ flex: 1 }}>
        {message && <div style={{ fontWeight: 600 }}>{message}</div>}
        {errors && Object.keys(errors).length > 0 && (
          <ul style={{ marginTop: '0.35rem', paddingLeft: '1.25rem', fontSize: '0.8125rem' }}>
            {Object.entries(errors).map(([field, err]) => (
              <li key={field}>
                <strong>{field}:</strong> {err}
              </li>
            ))}
          </ul>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Dismiss error"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;

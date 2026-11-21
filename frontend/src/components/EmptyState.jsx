import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Available',
  description = 'There are no records to display at this moment.',
  actionLabel,
  onAction
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      backgroundColor: 'var(--color-surface)',
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      textAlign: 'center',
      margin: '1rem 0'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-bg-alt)',
        color: 'var(--color-text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <Icon size={28} />
      </div>

      <h4 style={{
        fontSize: '1rem',
        fontWeight: 700,
        color: 'var(--color-text)',
        marginBottom: '0.35rem'
      }}>
        {title}
      </h4>

      <p style={{
        fontSize: '0.875rem',
        color: 'var(--color-text-secondary)',
        maxWidth: '380px',
        marginBottom: actionLabel ? '1.25rem' : 0
      }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

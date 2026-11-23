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
      padding: '3.5rem 1.5rem',
      backgroundColor: 'var(--color-surface)',
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      textAlign: 'center',
      margin: '1.25rem 0',
      width: '100%'
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
        marginBottom: '1rem',
        flexShrink: 0
      }}>
        <Icon size={32} style={{ width: 32, height: 32, flexShrink: 0 }} />
      </div>

      <h4 style={{
        fontSize: '1.05rem',
        fontWeight: 700,
        color: 'var(--color-text)',
        marginBottom: '0.35rem'
      }}>
        {title}
      </h4>

      <p style={{
        fontSize: '0.875rem',
        color: 'var(--color-text-secondary)',
        maxWidth: '420px',
        lineHeight: 1.5,
        marginBottom: actionLabel && onAction ? '1.5rem' : 0
      }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onAction}
          style={{ marginTop: '0.5rem' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

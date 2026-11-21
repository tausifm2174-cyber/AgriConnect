import React from 'react';

export const StatusBadge = ({ status, type = 'status' }) => {
  if (!status) return null;

  // Grade badge styling
  if (type === 'grade' || ['A', 'B', 'C'].includes(status)) {
    const gradeStyles = {
      A: { bg: 'var(--grade-a-bg)', color: 'var(--grade-a-color)', border: '#86efac' },
      B: { bg: 'var(--grade-b-bg)', color: 'var(--grade-b-color)', border: '#7dd3fc' },
      C: { bg: 'var(--grade-c-bg)', color: 'var(--grade-c-color)', border: '#fdba74' },
    };
    const s = gradeStyles[status] || { bg: 'var(--color-bg-alt)', color: 'var(--color-text)', border: 'var(--color-border)' };

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.2rem 0.65rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        borderRadius: 'var(--radius-full)',
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        letterSpacing: '0.025em'
      }}>
        Grade {status}
      </span>
    );
  }

  // General Status Pill styling
  const statusStyles = {
    // Harvest Statuses
    AVAILABLE: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)' },
    PARTIALLY_SOLD: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)' },
    SOLD_OUT: { bg: 'var(--color-bg-alt)', color: 'var(--color-text-secondary)', border: 'var(--color-border)' },

    // Order Statuses
    PENDING: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)' },
    ACCEPTED: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)' },
    CONFIRMED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)' },
    REJECTED: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)' },
    CANCELLED: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)' },

    // Verification Statuses
    VERIFIED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)' },

    // Requirement Statuses
    OPEN: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'var(--color-primary-border)' },
    FULFILLED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)' },
    EXPIRED: { bg: 'var(--color-bg-alt)', color: 'var(--color-text-muted)', border: 'var(--color-border)' },

    // Delivery Statuses
    READY_FOR_PICKUP: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)' },
    DISPATCHED: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)' },
    IN_TRANSIT: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)' },
    DELIVERED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)' },

    // Payment Statuses
    PAID: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)' },
    COMPLETED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)' },
    FAILED: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)' },
    REFUNDED: { bg: 'var(--color-bg-alt)', color: 'var(--color-text-secondary)', border: 'var(--color-border)' },

    // User Statuses
    ACTIVE: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)' },
    INACTIVE: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)' },
  };

  const current = statusStyles[status] || {
    bg: 'var(--color-bg-alt)',
    color: 'var(--color-text-secondary)',
    border: 'var(--color-border)'
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.2rem 0.65rem',
      fontSize: '0.75rem',
      fontWeight: 700,
      borderRadius: 'var(--radius-full)',
      backgroundColor: current.bg,
      color: current.color,
      border: `1px solid ${current.border}`,
      textTransform: 'uppercase',
      letterSpacing: '0.035em'
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default StatusBadge;

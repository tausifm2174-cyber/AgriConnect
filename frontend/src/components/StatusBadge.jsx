import React from 'react';
import {
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const StatusBadge = ({ status, type = 'status', showIcon = true, className = '', style = {} }) => {
  if (!status) return null;

  // Grade badge styling
  if (type === 'grade' || ['A', 'B', 'C'].includes(status)) {
    const gradeStyles = {
      A: { bg: 'var(--grade-a-bg)', color: 'var(--grade-a-color)', border: '#86efac' },
      B: { bg: 'var(--grade-b-bg)', color: 'var(--grade-b-color)', border: '#7dd3fc' },
      C: { bg: 'var(--grade-c-bg)', color: 'var(--grade-c-color)', border: '#fdba74' },
    };
    const s = gradeStyles[status] || {
      bg: 'var(--color-bg-alt)',
      color: 'var(--color-text)',
      border: 'var(--color-border)',
    };

    return (
      <span
        className={`status-badge ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.2rem 0.65rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          borderRadius: 'var(--radius-full)',
          backgroundColor: s.bg,
          color: s.color,
          border: `1px solid ${s.border}`,
          letterSpacing: '0.025em',
          ...style,
        }}
      >
        {showIcon && <Award size={12} />}
        <span>Grade {status}</span>
      </span>
    );
  }

  // General Status Pill styling & icon mapping
  const statusConfig = {
    // Harvest Statuses
    AVAILABLE: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', icon: Sparkles },
    PARTIALLY_SOLD: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)', icon: AlertTriangle },
    SOLD_OUT: { bg: 'var(--color-bg-alt)', color: 'var(--color-text-secondary)', border: 'var(--color-border)', icon: Clock },

    // Order Statuses
    PENDING: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)', icon: Clock },
    ACCEPTED: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)', icon: CheckCircle2 },
    CONFIRMED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', icon: CheckCircle2 },
    REJECTED: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)', icon: XCircle },
    CANCELLED: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)', icon: XCircle },

    // Quality & Verification Statuses
    VERIFIED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', icon: ShieldCheck },
    NOT_ASSESSED: { bg: 'var(--color-bg-alt)', color: 'var(--color-text-muted)', border: 'var(--color-border)', icon: Clock },

    // Requirement Statuses
    OPEN: { bg: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'var(--color-primary-border)', icon: Sparkles },
    FULFILLED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', icon: CheckCircle2 },
    EXPIRED: { bg: 'var(--color-bg-alt)', color: 'var(--color-text-muted)', border: 'var(--color-border)', icon: Clock },

    // Delivery Statuses
    READY_FOR_PICKUP: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)', icon: Clock },
    DISPATCHED: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)', icon: Truck },
    IN_TRANSIT: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)', icon: Truck },
    DELIVERED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', icon: CheckCircle2 },

    // Payment Statuses
    PAID: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', icon: CheckCircle2 },
    COMPLETED: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', icon: CheckCircle2 },
    PROCESSING: { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)', icon: Clock },
    FAILED: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)', icon: XCircle },
    REFUNDED: { bg: 'var(--color-bg-alt)', color: 'var(--color-text-secondary)', border: 'var(--color-border)', icon: RotateCcw },

    // User Statuses
    ACTIVE: { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', icon: CheckCircle2 },
    INACTIVE: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)', icon: XCircle },
  };

  const current = statusConfig[status] || {
    bg: 'var(--color-bg-alt)',
    color: 'var(--color-text-secondary)',
    border: 'var(--color-border)',
    icon: null,
  };

  const Icon = current.icon;

  return (
    <span
      className={`status-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.65rem',
        fontSize: '0.72rem',
        fontWeight: 700,
        borderRadius: 'var(--radius-full)',
        backgroundColor: current.bg,
        color: current.color,
        border: `1px solid ${current.border}`,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
        ...style,
      }}
    >
      {showIcon && Icon && <Icon size={12} style={{ flexShrink: 0 }} />}
      <span>{status.replace(/_/g, ' ')}</span>
    </span>
  );
};

export default StatusBadge;

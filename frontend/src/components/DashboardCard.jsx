import React from 'react';

export const DashboardCard = ({
  title,
  value,
  description,
  icon: Icon,
  variant = 'primary',
  trend,
  trendLabel
}) => {
  const variantMap = {
    primary: {
      borderTop: '3px solid var(--color-primary)',
      iconBg: 'var(--color-primary-light)',
      iconColor: 'var(--color-primary)'
    },
    secondary: {
      borderTop: '3px solid var(--color-secondary)',
      iconBg: 'var(--color-secondary-light)',
      iconColor: 'var(--color-secondary)'
    },
    accent: {
      borderTop: '3px solid var(--color-accent)',
      iconBg: 'var(--color-accent-light)',
      iconColor: 'var(--color-accent)'
    },
    success: {
      borderTop: '3px solid var(--color-success)',
      iconBg: 'var(--color-success-bg)',
      iconColor: 'var(--color-success)'
    },
    warning: {
      borderTop: '3px solid var(--color-warning)',
      iconBg: 'var(--color-warning-bg)',
      iconColor: 'var(--color-warning)'
    }
  };

  const style = variantMap[variant] || variantMap.primary;

  return (
    <div className="card" style={{
      borderTop: style.borderTop,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <span style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            {title}
          </span>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-text)',
            lineHeight: 1.2,
            marginTop: '0.35rem'
          }}>
            {value}
          </div>
        </div>

        {Icon && (
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: style.iconBg,
            color: style.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon size={22} />
          </div>
        )}
      </div>

      {(description || trend) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
          marginTop: '0.25rem',
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: '0.625rem'
        }}>
          {trend && (
            <span style={{
              fontWeight: 700,
              color: trend.startsWith('+') ? 'var(--color-success)' : 'var(--color-danger)'
            }}>
              {trend}
            </span>
          )}
          <span>{trendLabel || description}</span>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;

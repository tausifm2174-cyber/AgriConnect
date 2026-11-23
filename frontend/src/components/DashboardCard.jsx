import React from 'react';
import {
  Wheat,
  ShoppingBag,
  Truck,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  ClipboardList,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Scale,
  FileText,
  Activity,
  Layers,
  Inbox
} from 'lucide-react';

const STRING_ICON_MAP = {
  'wheat': Wheat,
  'shopping-bag': ShoppingBag,
  'truck': Truck,
  'credit-card': CreditCard,
  'currency-rupee': CreditCard,
  'shield-check': ShieldCheck,
  'trending-up': TrendingUp,
  'clipboard-list': ClipboardList,
  'sparkles': Sparkles,
  'users': Users,
  'check-circle': CheckCircle2,
  'clock': Clock,
  'scale': Scale,
  'document-text': FileText,
  'activity': Activity,
  'layers': Layers,
  'inbox': Inbox
};

export const DashboardCard = ({
  title,
  value,
  description,
  subtitle,
  icon,
  variant,
  color,
  trend,
  trendLabel
}) => {
  // Resolve icon component whether passed as a Lucide component or string identifier
  let IconComponent = null;
  if (icon) {
    if (typeof icon === 'string') {
      IconComponent = STRING_ICON_MAP[icon] || Activity;
    } else {
      IconComponent = icon;
    }
  }

  // Resolve color/variant token
  const resolvedVariant = variant || color || 'primary';
  const variantMap = {
    primary: {
      borderTop: '3px solid var(--color-primary)',
      iconBg: 'var(--color-primary-light)',
      iconColor: 'var(--color-primary)'
    },
    emerald: {
      borderTop: '3px solid var(--color-primary)',
      iconBg: 'var(--color-primary-light)',
      iconColor: 'var(--color-primary)'
    },
    secondary: {
      borderTop: '3px solid var(--color-secondary)',
      iconBg: 'var(--color-secondary-light)',
      iconColor: 'var(--color-secondary)'
    },
    amber: {
      borderTop: '3px solid var(--color-secondary)',
      iconBg: 'var(--color-secondary-light)',
      iconColor: 'var(--color-secondary)'
    },
    accent: {
      borderTop: '3px solid var(--color-accent)',
      iconBg: 'var(--color-accent-light)',
      iconColor: 'var(--color-accent)'
    },
    blue: {
      borderTop: '3px solid var(--color-accent)',
      iconBg: 'var(--color-accent-light)',
      iconColor: 'var(--color-accent)'
    },
    purple: {
      borderTop: '3px solid #7c3aed',
      iconBg: '#f3e8ff',
      iconColor: '#7c3aed'
    },
    teal: {
      borderTop: '3px solid #0d9488',
      iconBg: '#ccfbf1',
      iconColor: '#0d9488'
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
    },
    danger: {
      borderTop: '3px solid var(--color-danger)',
      iconBg: 'var(--color-danger-bg)',
      iconColor: 'var(--color-danger)'
    },
    gray: {
      borderTop: '3px solid var(--color-border-strong)',
      iconBg: 'var(--color-bg-alt)',
      iconColor: 'var(--color-text-secondary)'
    }
  };

  const style = variantMap[resolvedVariant] || variantMap.primary;
  const displayDesc = description || subtitle;

  return (
    <div className="card" style={{
      borderTop: style.borderTop,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      padding: '1.25rem 1.35rem',
      minHeight: '128px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--color-text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'block'
          }}>
            {title}
          </span>
          <div style={{
            fontSize: '1.625rem',
            fontWeight: 800,
            color: 'var(--color-text)',
            lineHeight: 1.25,
            marginTop: '0.35rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {value}
          </div>
        </div>

        {IconComponent && (
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
            <IconComponent size={22} style={{ width: 22, height: 22, flexShrink: 0 }} />
          </div>
        )}
      </div>

      {(displayDesc || trend) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.785rem',
          color: 'var(--color-text-muted)',
          marginTop: 'auto',
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: '0.5rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {trend && (
            <span style={{
              fontWeight: 700,
              color: String(trend).startsWith('+') ? 'var(--color-success)' : 'var(--color-danger)'
            }}>
              {trend}
            </span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{trendLabel || displayDesc}</span>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;

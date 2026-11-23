import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const DetailModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: HeaderIcon,
  badge,
  sections = [],
  children,
  actions,
  maxWidth = '640px',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'detailModalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-bg-alt)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {HeaderIcon && (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-primary)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <HeaderIcon size={18} />
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                  {title}
                </h3>
                {badge && <span>{badge}</span>}
              </div>
              {subtitle && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: 'ui-monospace, monospace', marginTop: '0.15rem' }}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {sections.map((section, sIdx) => {
            const SectionIcon = section.icon;
            return (
              <div
                key={sIdx}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  overflow: 'hidden',
                }}
              >
                {section.title && (
                  <div
                    style={{
                      padding: '0.65rem 1rem',
                      backgroundColor: 'var(--color-bg)',
                      borderBottom: '1px solid var(--color-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {SectionIcon && <SectionIcon size={14} />}
                    <span>{section.title}</span>
                  </div>
                )}

                <div
                  style={{
                    padding: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.85rem',
                  }}
                >
                  {section.items?.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      style={{
                        gridColumn: item.fullWidth ? '1 / -1' : 'auto',
                        padding: '0.5rem 0.65rem',
                        backgroundColor: item.highlight ? 'var(--color-primary-subtle)' : 'transparent',
                        borderRadius: 'var(--radius-md)',
                        border: item.highlight ? '1px solid var(--color-primary-border)' : '1px solid transparent',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          color: item.highlight ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: item.large ? '1.125rem' : '0.875rem',
                          fontWeight: item.bold || item.highlight || item.large ? 700 : 500,
                          color: item.highlight ? 'var(--color-primary)' : 'var(--color-text)',
                          fontFamily: item.mono ? 'ui-monospace, monospace' : 'inherit',
                          marginTop: '0.2rem',
                          wordBreak: 'break-word',
                        }}
                      >
                        {item.value || 'Not provided'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {children}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {actions ? (
            actions
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ minWidth: '90px' }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes detailModalSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default DetailModal;

import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel,
  confirmText = 'Confirm',
  cancelLabel,
  cancelText = 'Cancel',
  isDanger = false,
  confirmVariant,
  isLoading = false,
  loading = false,
  children,
}) => {
  const finalConfirmLabel = confirmLabel || confirmText;
  const finalCancelLabel = cancelLabel || cancelText;
  const finalIsDanger = isDanger || confirmVariant === 'danger';
  const finalLoading = isLoading || loading;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="440px">
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: finalIsDanger ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
          color: finalIsDanger ? 'var(--color-danger)' : 'var(--color-warning)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <AlertTriangle size={22} />
        </div>

        <div style={{ flex: 1 }}>
          {message && (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {message}
            </div>
          )}
          {children}
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        marginTop: '1.75rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--color-border-subtle)'
      }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={finalLoading}
        >
          {finalCancelLabel}
        </button>
        <button
          type="button"
          className={`btn ${finalIsDanger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={finalLoading}
        >
          {finalLoading ? 'Processing...' : finalConfirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

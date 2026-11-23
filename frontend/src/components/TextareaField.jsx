import React from 'react';
import { AlertCircle } from 'lucide-react';

export const TextareaField = ({
  label,
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  disabled = false,
  error,
  helperText,
  className = '',
  style = {},
  textareaStyle = {},
}) => {
  const textareaId = id || name || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`form-group ${className}`} style={{ marginBottom: '1rem', ...style }}>
      {label && (
        <label
          htmlFor={textareaId}
          className="form-label"
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '0.35rem',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--color-danger)', marginLeft: '0.25rem' }}>*</span>
          )}
        </label>
      )}

      <textarea
        id={textareaId}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        className="form-control"
        style={{
          width: '100%',
          padding: '0.65rem 0.85rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--color-text)',
          backgroundColor: disabled ? 'var(--color-bg-alt)' : 'var(--color-surface)',
          border: error ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          ...textareaStyle,
        }}
      />

      {error ? (
        <div
          className="form-error"
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-danger)',
            marginTop: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            marginTop: '0.35rem',
          }}
        >
          {helperText}
        </div>
      ) : null}
    </div>
  );
};

export default TextareaField;

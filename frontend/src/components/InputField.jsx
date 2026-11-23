import React from 'react';
import { AlertCircle } from 'lucide-react';

export const InputField = ({
  label,
  type = 'text',
  id,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  icon: Icon,
  suffix,
  min,
  max,
  step,
  className = '',
  style = {},
  inputStyle = {},
  autoComplete,
}) => {
  const inputId = id || name || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`form-group ${className}`} style={{ marginBottom: '1rem', ...style }}>
      {label && (
        <label
          htmlFor={inputId}
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

      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '0.85rem',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <Icon size={16} />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          min={min}
          max={max}
          step={step}
          autoComplete={autoComplete}
          className="form-control"
          style={{
            width: '100%',
            height: '42px',
            paddingLeft: Icon ? '2.35rem' : '0.85rem',
            paddingRight: suffix ? '3rem' : '0.85rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--color-text)',
            backgroundColor: disabled ? 'var(--color-bg-alt)' : 'var(--color-surface)',
            border: error ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            ...inputStyle,
          }}
        />

        {suffix && (
          <span
            style={{
              position: 'absolute',
              right: '0.85rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          >
            {suffix}
          </span>
        )}
      </div>

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

export default InputField;

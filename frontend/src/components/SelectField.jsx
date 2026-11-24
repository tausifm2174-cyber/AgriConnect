import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export const SelectField = ({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  className = '',
  style = {},
  selectStyle = {},
  size = 'md',
  children,
}) => {
  const selectId = id || name || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const height = size === 'sm' ? '36px' : size === 'lg' ? '46px' : '42px';
  const fontSize = size === 'sm' ? '0.8125rem' : size === 'lg' ? '0.9375rem' : '0.875rem';
  const padding = size === 'sm' ? '0.35rem 2rem 0.35rem 0.75rem' : '0.55rem 2.25rem 0.55rem 0.85rem';

  return (
    <div className={`form-group ${className}`} style={{ marginBottom: label ? '1rem' : 0, ...style }}>
      {label && (
        <label
          htmlFor={selectId}
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

      <div style={{ position: 'relative', width: '100%' }}>
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="form-control"
          style={{
            width: '100%',
            height,
            padding,
            fontSize,
            fontWeight: 500,
            color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
            backgroundColor: disabled ? 'var(--color-bg-alt)' : 'var(--color-surface)',
            border: error ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            ...selectStyle,
          }}
        >
          {placeholder && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}

          {children ||
            options.map((opt) => {
              if (typeof opt === 'object' && opt !== null) {
                return (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label || opt.value}
                  </option>
                );
              }
              return (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              );
            })}
        </select>

        <div
          style={{
            position: 'absolute',
            right: size === 'sm' ? '0.65rem' : '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronDown size={size === 'sm' ? 14 : 16} />
        </div>
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

export default SelectField;

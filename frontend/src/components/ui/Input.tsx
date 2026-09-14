import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, style, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--text-muted)',
              letterSpacing: '0.01em',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <div
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            style={{
              width: '100%',
              backgroundColor: '#121214',
              border: '1px solid ' + (error ? 'var(--status-danger)' : 'var(--border-subtle)'),
              borderRadius: '8px',
              padding: leftIcon ? '10px 14px 10px 38px' : rightIcon ? '10px 38px 10px 14px' : '10px 14px',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              fontFamily: 'var(--font-sans)',
              ...style,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--status-danger)' : 'var(--primary-red)';
              e.currentTarget.style.boxShadow = error
                ? '0 0 0 1px var(--status-danger)'
                : '0 0 0 1px var(--primary-red)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--status-danger)' : 'var(--border-subtle)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            {...props}
          />
          {rightIcon && (
            <div
              style={{
                position: 'absolute',
                right: '12px',
                color: 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)' }}>{error}</span>
        )}
        {!error && helperText && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{helperText}</span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

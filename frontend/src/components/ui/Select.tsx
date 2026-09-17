import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, style, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-main)',
              letterSpacing: '0.02em',
            }}
          >
            {label}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            id={selectId}
            ref={ref}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid ' + (error ? 'var(--status-danger)' : 'var(--border-subtle)'),
              borderRadius: '0.375em',
              padding: '10px 36px 10px 14px',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              outline: 'none',
              appearance: 'none',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
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
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                {opt.label}
              </option>
            ))}
          </select>
          <div
            style={{
              position: 'absolute',
              right: '12px',
              pointerEvents: 'none',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChevronDown size={16} />
          </div>
        </div>
        {error && <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)' }}>{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';

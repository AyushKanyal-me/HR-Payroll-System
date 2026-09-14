import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    borderRadius: '8px',
    border: 'none',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '0.8125rem' },
    md: { padding: '9px 16px', fontSize: '0.875rem' },
    lg: { padding: '12px 24px', fontSize: '1rem' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--primary-red)',
      color: '#ffffff',
      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
    },
    secondary: {
      backgroundColor: '#1c1c20',
      color: '#f4f4f5',
      border: '1px solid var(--border-subtle)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#f4f4f5',
      border: '1px solid var(--border-strong)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-muted)',
    },
    danger: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.3)',
    },
  };

  return (
    <button
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

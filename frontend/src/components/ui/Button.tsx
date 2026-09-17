import React, { ButtonHTMLAttributes, ReactNode, useState } from 'react';
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
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: 600,
    fontFamily: 'var(--font-sans)',
    textTransform: 'uppercase',
    letterSpacing: '0.075em',
    borderRadius: '0.375em',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: 'all 0.2s ease-in-out',
    textDecoration: 'none',
    outline: 'none',
    whiteSpace: 'nowrap',
    border: 'none',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 14px', fontSize: '0.75rem', height: '32px' },
    md: { padding: '9px 20px', fontSize: '0.8125rem', height: '40px' },
    lg: { padding: '12px 28px', fontSize: '0.875rem', height: '48px' },
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isHovered ? 'var(--primary-red-hover)' : 'var(--primary-red)',
          color: '#ffffff',
          boxShadow: isHovered ? '0 4px 12px rgba(245, 106, 106, 0.3)' : 'none',
        };
      case 'secondary':
        return {
          backgroundColor: isHovered ? 'var(--btn-dark-hover)' : 'var(--btn-dark-bg)',
          color: '#ffffff',
        };
      case 'outline':
        return {
          backgroundColor: isHovered ? 'var(--primary-red-subtle)' : 'transparent',
          color: 'var(--primary-red)',
          boxShadow: 'inset 0 0 0 2px var(--primary-red)',
        };
      case 'ghost':
        return {
          backgroundColor: isHovered ? 'var(--bg-surface-hover)' : 'transparent',
          color: 'var(--text-main)',
        };
      case 'danger':
        return {
          backgroundColor: isHovered ? 'var(--status-danger)' : 'var(--status-danger-bg)',
          color: isHovered ? '#ffffff' : 'var(--status-danger)',
          boxShadow: 'inset 0 0 0 1px var(--status-danger)',
        };
      default:
        return {};
    }
  };

  return (
    <button
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...getVariantStyles(),
        ...style,
      }}
      disabled={disabled || isLoading}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave?.(e);
      }}
      {...props}
    >
      {isLoading ? <Loader2 size={15} className="animate-spin" /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

import React from 'react';
import { STATUS_COLORS } from '../../utils/constants';

interface BadgeProps {
  status?: string;
  variant?: 'default' | 'red' | 'green' | 'amber' | 'blue' | 'purple';
  children?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, children, size = 'sm' }) => {
  const text = children || status?.replace(/_/g, ' ');

  let bg = 'rgba(113, 113, 122, 0.12)';
  let color = '#a1a1aa';
  let border = 'rgba(113, 113, 122, 0.3)';

  if (status && STATUS_COLORS[status.toUpperCase()]) {
    const config = STATUS_COLORS[status.toUpperCase()];
    bg = config.bg;
    color = config.text;
    border = config.border;
  } else if (variant === 'red') {
    bg = 'rgba(220, 38, 38, 0.15)';
    color = '#ef4444';
    border = 'rgba(220, 38, 38, 0.3)';
  } else if (variant === 'green') {
    bg = 'rgba(16, 185, 129, 0.15)';
    color = '#10b981';
    border = 'rgba(16, 185, 129, 0.3)';
  } else if (variant === 'amber') {
    bg = 'rgba(245, 158, 11, 0.15)';
    color = '#f59e0b';
    border = 'rgba(245, 158, 11, 0.3)';
  } else if (variant === 'blue') {
    bg = 'rgba(59, 130, 246, 0.15)';
    color = '#60a5fa';
    border = 'rgba(59, 130, 246, 0.3)';
  } else if (variant === 'purple') {
    bg = 'rgba(168, 85, 247, 0.15)';
    color = '#c084fc';
    border = 'rgba(168, 85, 247, 0.3)';
  }

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSmall ? '3px 8px' : '5px 12px',
        borderRadius: '9999px',
        fontSize: isSmall ? '0.72rem' : '0.8125rem',
        fontWeight: 600,
        backgroundColor: bg,
        color: color,
        border: '1px solid ' + border,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
};

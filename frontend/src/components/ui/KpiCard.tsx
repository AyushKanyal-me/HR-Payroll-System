import React, { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'var(--primary-red)',
}) => {
  return (
    <div
      className="card-luxury card-luxury-interactive"
      style={{
        padding: '22px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          backgroundColor: accentColor,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {title}
        </span>
        {icon && (
          <div
            style={{
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: 'var(--primary-red-subtle)',
              border: '1px solid var(--border-subtle)',
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '2px' }}>
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </h2>
        {trend && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: trend.isPositive ? 'var(--status-success)' : 'var(--status-danger)',
            }}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

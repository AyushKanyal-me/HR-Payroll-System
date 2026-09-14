import React, { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  action,
  icon = <Inbox size={36} color="var(--text-dim)" />,
}) => {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: '12px',
        border: '1px dashed var(--border-strong)',
      }}
    >
      <div
        style={{
          padding: '16px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          marginBottom: '16px',
        }}
      >
        {icon}
      </div>
      <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
        {title}
      </h4>
      {message && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', maxWidth: '400px', marginBottom: action ? '20px' : '0' }}>
          {message}
        </p>
      )}
      {action}
    </div>
  );
};

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { QuickCheckInCard } from '../../components/employee-portal/QuickCheckInCard';
import { LeaveBalanceCard } from '../../components/employee-portal/LeaveBalanceCard';
import { RecentPayslipsCard } from '../../components/employee-portal/RecentPayslipsCard';
import { getInitials } from '../../utils/formatters';
import { Briefcase, Mail } from 'lucide-react';

export const EmployeePortal: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div
        className="card-luxury"
        style={{
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '4px solid var(--primary-red)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-red-subtle)',
              border: '2px solid var(--primary-red)',
              color: 'var(--primary-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
            }}
          >
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                fontFamily: 'var(--font-heading)',
                color: 'var(--text-main)',
                letterSpacing: '-0.01em',
              }}
            >
              Welcome back, {user?.firstName || 'Colleague'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-sans)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={14} color="var(--primary-red)" /> {user?.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Briefcase size={14} color="var(--text-dim)" /> Employee Portal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Portal Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <QuickCheckInCard />
        <LeaveBalanceCard />
        <RecentPayslipsCard />
      </div>
    </div>
  );
};

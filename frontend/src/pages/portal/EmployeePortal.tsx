import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { QuickCheckInCard } from '../../components/employee-portal/QuickCheckInCard';
import { LeaveBalanceCard } from '../../components/employee-portal/LeaveBalanceCard';
import { RecentPayslipsCard } from '../../components/employee-portal/RecentPayslipsCard';
import { getInitials } from '../../utils/formatters';
import { User, Briefcase, Building2, Mail } from 'lucide-react';
import { DoodleHalfTree } from '../../components/doodles/DoodleArt';

export const EmployeePortal: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div
        className="card-luxury"
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #18181b 0%, #121214 100%)',
          borderLeft: '4px solid var(--primary-red)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Golden Plain Half Tree Doodle */}
        <div
          style={{
            position: 'absolute',
            right: '25px',
            top: '-15px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <DoodleHalfTree size={160} color="#d4af37" opacity={0.75} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(220, 38, 38, 0.15)',
              border: '2px solid rgba(220, 38, 38, 0.4)',
              color: 'var(--primary-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
            }}
          >
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f4f4f5' }}>
              Welcome back, {user?.firstName || 'Colleague'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={14} color="var(--text-dim)" /> {user?.email}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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

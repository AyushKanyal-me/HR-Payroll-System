import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { attendanceApi } from '../../api/endpoints';
import { AttendanceQuickStatus } from '../../types';
import { Search, Clock, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';

export const Topbar: React.FC = () => {
  const { user, isEmployeeOnly } = useAuth();
  const toast = useToast();
  const [quickStatus, setQuickStatus] = useState<AttendanceQuickStatus | null>(null);
  const [isPunching, setIsPunching] = useState(false);

  useEffect(() => {
    if (user?.employeeId) {
      attendanceApi
        .getQuickStatus(user.employeeId)
        .then((res) => {
          if (res.success && res.data) setQuickStatus(res.data);
        })
        .catch(() => {});
    }
  }, [user?.employeeId]);

  const handlePunchToggle = async () => {
    if (!user?.employeeId) return;
    setIsPunching(true);
    try {
      if (quickStatus?.is_checked_in && !quickStatus?.is_checked_out) {
        // Punch out
        const res = await attendanceApi.checkOut({ employee_id: user.employeeId });
        if (res.success) {
          toast.success('Punched Out', 'Your attendance record has been updated.');
          setQuickStatus((prev) => (prev ? { ...prev, is_checked_out: true, check_out: new Date().toISOString() } : null));
        }
      } else {
        // Punch in
        const res = await attendanceApi.checkIn({ employee_id: user.employeeId });
        if (res.success) {
          toast.success('Punched In', 'Welcome! Your workday has started.');
          setQuickStatus((prev) => (prev ? { ...prev, is_checked_in: true, is_checked_out: false, check_in: new Date().toISOString() } : null));
        }
      }
    } catch (err: any) {
      toast.error('Attendance Action Failed', err.message);
    } finally {
      setIsPunching(false);
    }
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'rgba(18, 18, 20, 0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Search Input (Hidden for Employee Portal) */}
      {!isEmployeeOnly ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '320px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)',
              }}
            />
            <input
              type="text"
              placeholder="Search employees, contracts, payruns..."
              style={{
                width: '100%',
                backgroundColor: '#141416',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '8px 12px 8px 36px',
                fontSize: '0.8125rem',
                color: 'var(--text-main)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
        </div>
      ) : (
        <div />
      )}

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Quick Punch Button (if linked to an employee) */}
        {user?.employeeId && (
          <Button
            size="sm"
            variant={quickStatus?.is_checked_in && !quickStatus?.is_checked_out ? 'secondary' : 'primary'}
            isLoading={isPunching}
            leftIcon={quickStatus?.is_checked_in && !quickStatus?.is_checked_out ? <LogOut size={14} /> : <LogIn size={14} />}
            onClick={handlePunchToggle}
          >
            {quickStatus?.is_checked_in && !quickStatus?.is_checked_out ? 'Punch Out' : 'Punch In'}
          </Button>
        )}

        {/* Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '9999px',
            backgroundColor: '#18181b',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <ShieldCheck size={14} color="var(--primary-red)" />
          <span>{user?.roles?.join(' • ') || 'Authenticated'}</span>
        </div>
      </div>
    </header>
  );
};

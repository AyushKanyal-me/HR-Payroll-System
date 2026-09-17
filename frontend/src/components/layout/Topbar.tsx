import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { attendanceApi } from '../../api/endpoints';
import { AttendanceQuickStatus } from '../../types';
import { Search, LogIn, LogOut, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/Button';

export const Topbar: React.FC = () => {
  const { user, isEmployeeOnly } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
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
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search employees, contracts, payruns..."
              style={{
                width: '100%',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '0.375em',
                padding: '8px 12px 8px 36px',
                fontSize: '0.8125rem',
                color: 'var(--text-main)',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
                transition: 'border-color 0.2s ease-in-out',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-red)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            />
          </div>
        </div>
      ) : (
        <div />
      )}

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Dark / Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Editorial Light Mode' : 'Switch to Dark Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '0.375em',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-hover)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary-red)';
            e.currentTarget.style.color = 'var(--primary-red)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.color = 'var(--text-main)';
          }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

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
            padding: '6px 14px',
            borderRadius: '0.375em',
            backgroundColor: 'var(--bg-sidebar)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
            fontWeight: 600,
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

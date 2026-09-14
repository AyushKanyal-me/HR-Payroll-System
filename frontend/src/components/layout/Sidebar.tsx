import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  FileSignature,
  Clock,
  CalendarDays,
  Building2,
  Briefcase,
  CalendarRange,
  Calculator,
  Layers,
  Banknote,
  Receipt,
  FileSearch,
  Settings,
  UserCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { getInitials } from '../../utils/formatters';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { user, isEmployeeOnly, isHR, isAdmin, logout } = useAuth();

  // Navigation schema based on role
  let navSections: NavSection[] = [];

  if (isEmployeeOnly) {
    navSections = [
      {
        title: 'MY PORTAL',
        items: [
          { to: '/portal', label: 'My Dashboard', icon: <LayoutDashboard size={18} /> },
          { to: '/my-attendance', label: 'My Attendance', icon: <Clock size={18} /> },
          { to: '/my-time-off', label: 'My Time Off', icon: <CalendarDays size={18} /> },
          { to: '/my-payslips', label: 'My Payslips', icon: <Receipt size={18} /> },
        ],
      },
    ];
  } else {
    // Management & Admin Navigation
    navSections = [
      {
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        ],
      },
      {
        title: 'MY SELF-SERVICE',
        items: [
          { to: '/portal', label: 'My Portal', icon: <LayoutDashboard size={18} /> },
          { to: '/my-attendance', label: 'My Attendance', icon: <Clock size={18} /> },
          { to: '/my-time-off', label: 'My Time Off', icon: <CalendarDays size={18} /> },
          { to: '/my-payslips', label: 'My Payslips', icon: <Receipt size={18} /> },
        ],
      },
      {
        title: 'CORE HR',
        items: [
          { to: '/employees', label: 'Employees', icon: <Users size={18} /> },
          { to: '/contracts', label: 'Contracts', icon: <FileSignature size={18} /> },
          { to: '/departments', label: 'Departments', icon: <Building2 size={18} /> },
          { to: '/positions', label: 'Job Positions', icon: <Briefcase size={18} /> },
          { to: '/schedules', label: 'Schedules', icon: <CalendarRange size={18} /> },
        ],
      },
      {
        title: 'TIME & ATTENDANCE',
        items: [
          { to: '/attendance', label: 'Attendance', icon: <Clock size={18} /> },
          ...((isAdmin || isHR)
            ? [
                { to: '/time-off', label: 'Time Off Requests', icon: <CalendarDays size={18} /> },
                { to: '/time-off-allocations', label: 'Leave Allocations', icon: <Sparkles size={18} /> },
              ]
            : []),
        ],
      },
      {
        title: 'PAYROLL & SALARY',
        items: [
          { to: '/payroll', label: 'Payrun Engine', icon: <Banknote size={18} /> },
          { to: '/payslips', label: 'Payslips Archive', icon: <Receipt size={18} /> },
          { to: '/salary-structures', label: 'Salary Structures', icon: <Layers size={18} /> },
          { to: '/salary-rules', label: 'Salary Rules', icon: <Calculator size={18} /> },
        ],
      },
      ...((isAdmin || isHR)
        ? [
            {
              title: 'SYSTEM',
              items: [
                { to: '/audit-logs', label: 'Audit Logs', icon: <FileSearch size={18} /> },
                ...(isAdmin ? [{ to: '/settings', label: 'Settings', icon: <Settings size={18} /> }] : []),
              ],
            },
          ]
        : []),
    ];
  }

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: '#101012',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 30,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(220, 38, 38, 0.4)',
          }}
        >
          <Banknote size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '4px' }}>
            HR Pay<span style={{ color: 'var(--primary-red)' }}> 360</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            HR & Payroll Platform
          </div>
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {navSections.map((section, sIdx) => (
          <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {section.title && (
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '4px 12px 6px',
                }}
              >
                {section.title}
              </div>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'var(--primary-red-subtle)' : 'transparent',
                  border: isActive ? '1px solid var(--border-accent)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{ color: isActive ? 'var(--primary-red)' : 'var(--text-dim)', display: 'flex' }}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* User Bottom Info & Logout */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: '#0c0c0e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              color: 'var(--primary-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8125rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.firstName ? user.firstName + ' ' + (user.lastName || '') : user?.email}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary-red)', fontWeight: 600, textTransform: 'uppercase' }}>
              {user?.roles?.[0] || 'EMPLOYEE'}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary-red)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

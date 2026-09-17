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
          { to: '/portal', label: 'My Dashboard', icon: <LayoutDashboard size={17} /> },
          { to: '/my-attendance', label: 'My Attendance', icon: <Clock size={17} /> },
          { to: '/my-time-off', label: 'My Time Off', icon: <CalendarDays size={17} /> },
          { to: '/my-payslips', label: 'My Payslips', icon: <Receipt size={17} /> },
        ],
      },
    ];
  } else {
    // Management & Admin Navigation
    navSections = [
      {
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
        ],
      },
      {
        title: 'MY SELF-SERVICE',
        items: [
          { to: '/portal', label: 'My Portal', icon: <LayoutDashboard size={17} /> },
          { to: '/my-attendance', label: 'My Attendance', icon: <Clock size={17} /> },
          { to: '/my-time-off', label: 'My Time Off', icon: <CalendarDays size={17} /> },
          { to: '/my-payslips', label: 'My Payslips', icon: <Receipt size={17} /> },
        ],
      },
      {
        title: 'CORE HR',
        items: [
          { to: '/employees', label: 'Employees', icon: <Users size={17} /> },
          { to: '/contracts', label: 'Contracts', icon: <FileSignature size={17} /> },
          { to: '/departments', label: 'Departments', icon: <Building2 size={17} /> },
          { to: '/positions', label: 'Job Positions', icon: <Briefcase size={17} /> },
          { to: '/schedules', label: 'Schedules', icon: <CalendarRange size={17} /> },
        ],
      },
      {
        title: 'TIME & ATTENDANCE',
        items: [
          { to: '/attendance', label: 'Attendance', icon: <Clock size={17} /> },
          ...((isAdmin || isHR)
            ? [
                { to: '/time-off', label: 'Time Off Requests', icon: <CalendarDays size={17} /> },
                { to: '/time-off-allocations', label: 'Leave Allocations', icon: <Sparkles size={17} /> },
              ]
            : []),
        ],
      },
      {
        title: 'PAYROLL & SALARY',
        items: [
          { to: '/payroll', label: 'Payrun Engine', icon: <Banknote size={17} /> },
          { to: '/payslips', label: 'Payslips Archive', icon: <Receipt size={17} /> },
          { to: '/salary-structures', label: 'Salary Structures', icon: <Layers size={17} /> },
          { to: '/salary-rules', label: 'Salary Rules', icon: <Calculator size={17} /> },
        ],
      },
      ...((isAdmin || isHR)
        ? [
            {
              title: 'SYSTEM',
              items: [
                { to: '/audit-logs', label: 'Audit Logs', icon: <FileSearch size={17} /> },
                ...(isAdmin ? [{ to: '/settings', label: 'Settings', icon: <Settings size={17} /> }] : []),
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
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        zIndex: 30,
        transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '22px 20px',
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
            borderRadius: '0.375em',
            backgroundColor: 'var(--primary-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(245, 106, 106, 0.3)',
          }}
        >
          <Banknote size={20} color="#ffffff" />
        </div>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            HR Pay<span style={{ color: 'var(--primary-red)' }}> 360</span>
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
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
          gap: '18px',
        }}
      >
        {navSections.map((section, sIdx) => (
          <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {section.title && (
              <div
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-heading)',
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
                  padding: '8px 12px',
                  borderRadius: '0.375em',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary-red)' : 'var(--text-main)',
                  backgroundColor: isActive ? 'var(--primary-red-subtle)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary-red)' : '3px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease-in-out',
                })}
              >
                {({ isActive }) => (
                  <>
                    <div style={{ color: isActive ? 'var(--primary-red)' : 'var(--text-muted)', display: 'flex' }}>
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
          padding: '14px 16px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-sidebar-alt)',
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
              backgroundColor: 'var(--primary-red-subtle)',
              border: '1.5px solid var(--primary-red)',
              color: 'var(--primary-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8125rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              flexShrink: 0,
            }}
          >
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.firstName ? user.firstName + ' ' + (user.lastName || '') : user?.email}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--primary-red)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.2s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--primary-red)';
            e.currentTarget.style.backgroundColor = 'var(--primary-red-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

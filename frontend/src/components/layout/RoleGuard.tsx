import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CanonicalRole } from '../../types';

interface RoleGuardProps {
  allowedRoles?: CanonicalRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { user, token, isLoading, hasRole, isEmployeeOnly } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#f4f4f5' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(220, 38, 38, 0.2)', borderTopColor: '#dc2626', borderRadius: '50%' }} className="animate-spin" />
          <span style={{ fontSize: '0.875rem', color: '#a1a1aa' }}>Authenticating HR Pay 360...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = hasRole(...allowedRoles);
    if (!isAllowed) {
      // If employee only, redirect to portal
      if (isEmployeeOnly) {
        return <Navigate to="/portal" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

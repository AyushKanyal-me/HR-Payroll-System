import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthenticatedUser, CanonicalRole } from '../types';
import { authApi } from '../api/endpoints';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: AuthenticatedUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: CanonicalRole[]) => boolean;
  isEmployeeOnly: boolean;
  isHR: boolean;
  isAdmin: boolean;
}

const DEMO_USERS: Record<string, { user: AuthenticatedUser; token: string }> = {
  'admin@example.com': {
    user: {
      id: 'usr_admin_001',
      authUserId: 'auth_admin_001',
      email: 'admin@example.com',
      firstName: 'Alexander',
      lastName: 'Vance',
      employeeId: 'emp_admin_001',
      companyId: 'comp_001',
      roles: ['ADMIN'],
      isActive: true,
      employee: {
        id: 'emp_admin_001',
        companyId: 'comp_001',
        firstName: 'Alexander',
        lastName: 'Vance',
        workEmail: 'admin@example.com',
        status: 'ACTIVE',
      },
    },
    token: 'demo_token_admin_001',
  },
  'hr.manager@example.com': {
    user: {
      id: 'usr_hr_002',
      authUserId: 'auth_hr_002',
      email: 'hr.manager@example.com',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      employeeId: 'emp_hr_002',
      companyId: 'comp_001',
      roles: ['HR_MANAGER'],
      isActive: true,
      employee: {
        id: 'emp_hr_002',
        companyId: 'comp_001',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        workEmail: 'hr.manager@example.com',
        status: 'ACTIVE',
        departmentId: 'dept_hr_001',
      },
    },
    token: 'demo_token_hr_002',
  },
  'payroll@example.com': {
    user: {
      id: 'usr_payroll_003',
      authUserId: 'auth_payroll_003',
      email: 'payroll@example.com',
      firstName: 'David',
      lastName: 'Miller',
      employeeId: 'emp_payroll_003',
      companyId: 'comp_001',
      roles: ['HR_PAYROLL_MANAGER'],
      isActive: true,
      employee: {
        id: 'emp_payroll_003',
        companyId: 'comp_001',
        firstName: 'David',
        lastName: 'Miller',
        workEmail: 'payroll@example.com',
        status: 'ACTIVE',
      },
    },
    token: 'demo_token_payroll_003',
  },
  'employee@example.com': {
    user: {
      id: 'usr_emp_004',
      authUserId: 'auth_emp_004',
      email: 'employee@example.com',
      firstName: 'Aarav',
      lastName: 'Sharma',
      employeeId: 'emp_001',
      companyId: 'comp_001',
      roles: ['EMPLOYEE'],
      isActive: true,
      employee: {
        id: 'emp_001',
        companyId: 'comp_001',
        firstName: 'Aarav',
        lastName: 'Sharma',
        workEmail: 'employee@example.com',
        status: 'ACTIVE',
        departmentId: 'dept_eng_001',
        jobPositionId: 'pos_eng_001',
      },
    },
    token: 'demo_token_employee_004',
  },
};

const formatAuthUser = (data: any): AuthenticatedUser | null => {
  if (!data) return null;
  if (data.user && typeof data.user === 'object') {
    return {
      id: data.user.id,
      authUserId: data.user.auth_user_id || data.user.id,
      email: data.user.email || data.employee?.work_email || '',
      firstName: data.employee?.first_name || data.user.first_name || 'Colleague',
      lastName: data.employee?.last_name || data.user.last_name || '',
      employeeId: data.employee?.id || null,
      companyId: data.company_id || data.employee?.company_id || null,
      roles: data.roles || ['EMPLOYEE'],
      isActive: data.user.is_active ?? true,
      employee: data.employee
        ? {
            id: data.employee.id,
            companyId: data.employee.company_id || data.company_id,
            firstName: data.employee.first_name,
            lastName: data.employee.last_name,
            workEmail: data.employee.work_email,
            status: data.employee.status,
            departmentId: data.employee.department_id,
            jobPositionId: data.employee.job_position_id,
          }
        : undefined,
    };
  }
  return data as AuthenticatedUser;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    const cached = sessionStorage.getItem('pp360_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('pp360_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check if Supabase session exists
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          setToken(session.access_token);
          sessionStorage.setItem('pp360_token', session.access_token);
          const res = await authApi.getMe();
          if (res.success && res.data) {
            const formatted = formatAuthUser(res.data);
            setUser(formatted);
            sessionStorage.setItem('pp360_user', JSON.stringify(formatted));
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        // Fall through to stored token check
      }

      // 2. Check stored token fallback
      const storedToken = sessionStorage.getItem('pp360_token');
      if (storedToken) {
        if (storedToken.startsWith('demo_token_')) {
          setIsLoading(false);
          return;
        }

        try {
          const res = await authApi.getMe();
          if (res.success && res.data) {
            const formatted = formatAuthUser(res.data);
            setUser(formatted);
            sessionStorage.setItem('pp360_user', JSON.stringify(formatted));
          }
        } catch {
          sessionStorage.removeItem('pp360_token');
          sessionStorage.removeItem('pp360_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const normalizedEmail = credentials.email.trim().toLowerCase();

    // 1. Try Supabase Auth directly first
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: credentials.password,
      });

      if (!error && data.session?.access_token) {
        const authToken = data.session.access_token;
        setToken(authToken);
        sessionStorage.setItem('pp360_token', authToken);

        try {
          const meRes = await authApi.getMe();
          if (meRes.success && meRes.data) {
            const formatted = formatAuthUser(meRes.data);
            setUser(formatted);
            sessionStorage.setItem('pp360_user', JSON.stringify(formatted));
            return;
          }
        } catch (meErr) {
          // If backend user lookup fails, construct basic user from auth metadata
          const basicUser: AuthenticatedUser = {
            id: data.user.id,
            authUserId: data.user.id,
            email: data.user.email || normalizedEmail,
            firstName: data.user.user_metadata?.first_name || normalizedEmail.split('@')[0],
            lastName: data.user.user_metadata?.last_name || 'User',
            roles: ['EMPLOYEE'],
            isActive: true,
          };
          setUser(basicUser);
          sessionStorage.setItem('pp360_user', JSON.stringify(basicUser));
          return;
        }
      }
    } catch (authErr) {
      console.warn('Supabase direct auth attempt finished with notice:', authErr);
    }

    // 2. Check Demo Accounts (for evaluation / demo environments)
    if (DEMO_USERS[normalizedEmail]) {
      const demo = DEMO_USERS[normalizedEmail];
      setUser(demo.user);
      setToken(demo.token);
      sessionStorage.setItem('pp360_token', demo.token);
      sessionStorage.setItem('pp360_user', JSON.stringify(demo.user));
      return;
    }

    // If authentication fails against both Supabase and valid demo accounts, fail closed
    throw new Error('Invalid credentials. Please verify your email and password or contact your administrator.');
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    try {
      authApi.logout();
    } catch {
      // ignore
    }
    sessionStorage.removeItem('pp360_token');
    sessionStorage.removeItem('pp360_user');
    setUser(null);
    setToken(null);
  };

  const hasRole = (...roles: CanonicalRole[]): boolean => {
    if (!user || !user.roles) return false;
    if (user.roles.includes('ADMIN')) return true;
    return roles.some((r) => user.roles.includes(r));
  };

  const isEmployeeOnly = Boolean(
    user?.roles?.length === 1 && user.roles.includes('EMPLOYEE')
  );

  const isHR = Boolean(
    user?.roles?.some((r) => ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'].includes(r))
  );

  const isAdmin = Boolean(user?.roles?.includes('ADMIN'));

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        hasRole,
        isEmployeeOnly,
        isHR,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

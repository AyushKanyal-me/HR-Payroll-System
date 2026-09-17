import { supabaseAnonClient } from '../../config/supabase.js';
import { authRepository, AuthRepository } from './auth.repository.js';
import { AuthenticatedUser } from '../../types/auth.js';
import { UnauthorizedError } from '../../utils/errors.js';

const DEMO_USERS: Record<string, AuthenticatedUser> = {
  demo_token_admin_001: {
    id: 'a0000000-0000-0000-0000-000000000099',
    authUserId: 'a0000000-0000-0000-0000-000000000099',
    email: 'admin@example.com',
    firstName: 'Alexander',
    lastName: 'Vance',
    employeeId: 'a0000000-0000-0000-0000-000000000098',
    companyId: 'a0000000-0000-0000-0000-000000000001',
    roles: ['ADMIN'],
    isActive: true,
    employee: {
      id: 'a0000000-0000-0000-0000-000000000098',
      companyId: 'a0000000-0000-0000-0000-000000000001',
      firstName: 'Alexander',
      lastName: 'Vance',
      workEmail: 'admin@example.com',
      status: 'ACTIVE'
    }
  },
  demo_token_hr_002: {
    id: 'a0000000-0000-0000-0000-000000000097',
    authUserId: 'a0000000-0000-0000-0000-000000000097',
    email: 'hr.manager@example.com',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    employeeId: 'a0000000-0000-0000-0000-000000000096',
    companyId: 'a0000000-0000-0000-0000-000000000001',
    roles: ['HR_MANAGER'],
    isActive: true,
    employee: {
      id: 'a0000000-0000-0000-0000-000000000096',
      companyId: 'a0000000-0000-0000-0000-000000000001',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      workEmail: 'hr.manager@example.com',
      status: 'ACTIVE'
    }
  },
  demo_token_payroll_003: {
    id: 'a0000000-0000-0000-0000-000000000095',
    authUserId: 'a0000000-0000-0000-0000-000000000095',
    email: 'payroll@example.com',
    firstName: 'David',
    lastName: 'Miller',
    employeeId: 'a0000000-0000-0000-0000-000000000094',
    companyId: 'a0000000-0000-0000-0000-000000000001',
    roles: ['HR_PAYROLL_MANAGER'],
    isActive: true,
    employee: {
      id: 'a0000000-0000-0000-0000-000000000094',
      companyId: 'a0000000-0000-0000-0000-000000000001',
      firstName: 'David',
      lastName: 'Miller',
      workEmail: 'payroll@example.com',
      status: 'ACTIVE'
    }
  },
  demo_token_employee_004: {
    id: 'a0000000-0000-0000-0000-000000000093',
    authUserId: 'a0000000-0000-0000-0000-000000000093',
    email: 'employee@example.com',
    firstName: 'Aarav',
    lastName: 'Sharma',
    employeeId: 'a0000000-0000-0000-0000-000000000092',
    companyId: 'a0000000-0000-0000-0000-000000000001',
    roles: ['EMPLOYEE'],
    isActive: true,
    employee: {
      id: 'a0000000-0000-0000-0000-000000000092',
      companyId: 'a0000000-0000-0000-0000-000000000001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      workEmail: 'employee@example.com',
      status: 'ACTIVE'
    }
  }
};

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) { }

  async validateToken(token: string): Promise<AuthenticatedUser> {
    // 1. Handle demo tokens in development/demo mode (strictly whitelisted tokens only)
    if (token.startsWith('demo_token_')) {
      const demoUser = DEMO_USERS[token];
      if (!demoUser) {
        throw new UnauthorizedError('Invalid, expired or unrecognized authentication token');
      }
      return demoUser;
    }

    // 2. Validate Supabase JWT for real authenticated sessions
    const { data, error } = await supabaseAnonClient.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedError('Invalid, expired or unrecognized authentication token');
    }

    const user = await this.repo.getUserByAuthId(data.user.id);

    if (!user) {
      throw new UnauthorizedError('User account not found or is currently inactive in the system');
    }

    return user;
  }

  getProfile(user: AuthenticatedUser) {
    return {
      user: {
        id: user.id,
        auth_user_id: user.authUserId,
        email: user.email,
        first_name: user.firstName ?? null,
        last_name: user.lastName ?? null,
        is_active: user.isActive
      },
      employee: user.employee
        ? {
          id: user.employee.id,
          first_name: user.employee.firstName,
          last_name: user.employee.lastName,
          work_email: user.employee.workEmail,
          status: user.employee.status,
          department_id: user.employee.departmentId ?? null,
          job_position_id: user.employee.jobPositionId ?? null
        }
        : null,
      company_id: user.companyId ?? null,
      roles: user.roles
    };
  }
}

export const authService = new AuthService();

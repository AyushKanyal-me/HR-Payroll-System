import { AuthenticatedUser, CanonicalRole } from '../types/auth.js';

/**
 * Checks if a user has at least one of the specified roles.
 * Note: ADMIN role always satisfies all checks.
 */
export function hasAnyRole(user: AuthenticatedUser | undefined | null, ...roles: CanonicalRole[]): boolean {
  if (!user || !user.roles) return false;
  if (user.roles.includes('ADMIN')) return true;
  return roles.some((role) => user.roles.includes(role));
}

/**
 * Checks if a user has all of the specified roles.
 * Note: ADMIN role always satisfies all checks.
 */
export function hasAllRoles(user: AuthenticatedUser | undefined | null, ...roles: CanonicalRole[]): boolean {
  if (!user || !user.roles) return false;
  if (user.roles.includes('ADMIN')) return true;
  return roles.every((role) => user.roles.includes(role));
}

/**
 * Returns true if the user only has the EMPLOYEE role without any elevated roles.
 */
export function isEmployeeOnly(user: AuthenticatedUser | undefined | null): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false;
  const elevatedRoles: CanonicalRole[] = ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'];
  return user.roles.includes('EMPLOYEE') && !user.roles.some((r) => elevatedRoles.includes(r));
}

/**
 * HR management access (ADMIN or HR_MANAGER).
 */
export function hasHrAccess(user: AuthenticatedUser | undefined | null): boolean {
  return hasAnyRole(user, 'HR_MANAGER');
}

/**
 * Payroll read access (ADMIN, HR_MANAGER, HR_PAYROLL_MANAGER, HR_PAYROLL_USER).
 */
export function hasPayrollReadAccess(user: AuthenticatedUser | undefined | null): boolean {
  return hasAnyRole(user, 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER');
}

/**
 * Payroll management access (ADMIN, HR_MANAGER, HR_PAYROLL_MANAGER).
 */
export function hasPayrollManageAccess(user: AuthenticatedUser | undefined | null): boolean {
  return hasAnyRole(user, 'HR_MANAGER', 'HR_PAYROLL_MANAGER');
}

/**
 * Checks if a user can access a specific employee's private/profile data.
 * Allowed if:
 * 1. User is ADMIN or HR_MANAGER
 * 2. User is the employee themselves (user.employeeId === targetEmployeeId)
 */
export function canAccessEmployee(user: AuthenticatedUser | undefined | null, targetEmployeeId: string): boolean {
  if (!user) return false;
  if (hasHrAccess(user)) return true;
  return !!user.employeeId && user.employeeId === targetEmployeeId;
}

/**
 * Checks if a user can access a company's data.
 * Allowed if:
 * 1. User is ADMIN (cross-company permitted)
 * 2. User belongs to the company (user.companyId === targetCompanyId)
 */
export function canAccessCompany(user: AuthenticatedUser | undefined | null, targetCompanyId: string): boolean {
  if (!user) return false;
  if (user.roles && user.roles.includes('ADMIN')) return true;
  return !!user.companyId && user.companyId === targetCompanyId;
}

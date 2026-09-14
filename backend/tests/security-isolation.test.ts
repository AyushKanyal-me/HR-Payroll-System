import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { companiesService } from '../src/modules/companies/companies.service.js';
import { employeesService } from '../src/modules/employees/employees.service.js';
import { departmentsService } from '../src/modules/departments/departments.service.js';
import { positionsService } from '../src/modules/positions/positions.service.js';
import { schedulesService } from '../src/modules/schedules/schedules.service.js';
import { contractsService } from '../src/modules/contracts/contracts.service.js';
import { attendanceService } from '../src/modules/attendance/attendance.service.js';
import { timeOffService } from '../src/modules/time-off/time-off.service.js';
import { salaryService } from '../src/modules/salary/salary.service.js';
import { payrollService } from '../src/modules/payroll/payroll.service.js';
import { payslipsService } from '../src/modules/payslips/payslips.service.js';
import { dashboardService } from '../src/modules/dashboard/dashboard.service.js';
import { AuthenticatedUser } from '../src/types/auth.js';

describe('PHASE B — Security, RBAC & Multi-Tenant Isolation Test Suite', () => {
  // Company A & B IDs (valid UUIDs)
  const companyAId = '11111111-1111-1111-1111-111111111111';
  const companyBId = '22222222-2222-2222-2222-222222222222';

  const employeeAId = '00000000-0000-0000-0000-000000000101';
  const employeeBId = '00000000-0000-0000-0000-000000000102';
  const employeeCId = '00000000-0000-0000-0000-000000000103';

  const userEmployeeA: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    authUserId: 'auth-user-emp-a',
    email: 'alice@companya.com',
    roles: ['EMPLOYEE'],
    isActive: true,
    companyId: companyAId,
    employeeId: employeeAId
  };

  const userEmployeeB: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000002',
    authUserId: 'auth-user-emp-b',
    email: 'bob@companya.com',
    roles: ['EMPLOYEE'],
    isActive: true,
    companyId: companyAId,
    employeeId: employeeBId
  };

  const userHrManagerA: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000003',
    authUserId: 'auth-user-hr-a',
    email: 'hr@companya.com',
    roles: ['HR_MANAGER'],
    isActive: true,
    companyId: companyAId,
    employeeId: employeeCId
  };

  const userPayrollManagerA: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000004',
    authUserId: 'auth-user-payroll-a',
    email: 'payroll@companya.com',
    roles: ['HR_PAYROLL_MANAGER'],
    isActive: true,
    companyId: companyAId,
    employeeId: '00000000-0000-0000-0000-000000000104'
  };

  const userPayrollUserA: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000005',
    authUserId: 'auth-user-payroll-user-a',
    email: 'payrolluser@companya.com',
    roles: ['HR_PAYROLL_USER'],
    isActive: true,
    companyId: companyAId,
    employeeId: '00000000-0000-0000-0000-000000000105'
  };

  const userAdmin: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000099',
    authUserId: 'auth-user-admin',
    email: 'superadmin@peoplepay360.com',
    roles: ['ADMIN'],
    isActive: true,
    companyId: companyAId,
    employeeId: '00000000-0000-0000-0000-000000000199'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. AUTHENTICATION TOKEN ENFORCEMENT (401)
  // =========================================================================
  describe('1. Authentication Validation (401)', () => {
    it('returns 401 Unauthorized when no token is provided', async () => {
      const res = await request(app).get('/api/v1/employees');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 Unauthorized when malformed authorization header is passed', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', 'Basic invalid-format');
      expect(res.status).toBe(401);
    });

    it('returns 401 Unauthorized when token is invalid or expired', async () => {
      vi.spyOn(authService, 'validateToken').mockRejectedValue(new Error('JWT expired'));
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', 'Bearer expired-token');
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // 2. RBAC ACCESS CONTROL (403)
  // =========================================================================
  describe('2. Canonical Role RBAC Access Control (403)', () => {
    it('denies standard EMPLOYEE from accessing employee directory (GET /api/v1/employees)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userEmployeeA);
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('denies standard EMPLOYEE from creating department (POST /api/v1/departments)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userEmployeeA);
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', 'Bearer valid-jwt')
        .send({ name: 'Engineering', code: 'ENG' });
      expect(res.status).toBe(403);
    });

    it('denies standard EMPLOYEE from accessing payrun batches (GET /api/v1/payruns)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userEmployeeA);
      const res = await request(app)
        .get('/api/v1/payruns')
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });

    it('denies HR_PAYROLL_USER from computing payrun (POST /api/v1/payruns/:id/compute)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userPayrollUserA);
      const res = await request(app)
        .post('/api/v1/payruns/00000000-0000-0000-0000-000000000001/compute')
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });

    it('denies standard EMPLOYEE from accessing system audit logs', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userEmployeeA);
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 3. EMPLOYEE SELF ACCESS VS PEER ACCESS
  // =========================================================================
  describe('3. Employee Self Access vs Peer Access', () => {
    it('allows Employee A to view their own profile', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userEmployeeA);
      vi.spyOn(employeesService, 'getEmployeeById').mockResolvedValue({
        id: employeeAId,
        company_id: companyAId,
        first_name: 'Alice',
        last_name: 'Smith',
        work_email: 'alice@companya.com',
        status: 'ACTIVE',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      } as any);

      const res = await request(app)
        .get(`/api/v1/employees/${employeeAId}`)
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(employeeAId);
    });

    it('denies Employee A from viewing Employee B profile (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userEmployeeA);
      const res = await request(app)
        .get(`/api/v1/employees/${employeeBId}`)
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });

    it('denies Employee A from viewing Employee B smart counts (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userEmployeeA);
      const res = await request(app)
        .get(`/api/v1/employees/${employeeBId}/smart-counts`)
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });

    it('denies Employee A from viewing Employee B contract (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userEmployeeA);
      vi.spyOn(contractsService, 'getContractById').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000501',
        employee_id: employeeBId,
        status: 'ACTIVE',
        employee: { company_id: companyAId }
      } as any);

      const res = await request(app)
        .get('/api/v1/contracts/00000000-0000-0000-0000-000000000501')
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });

    it('denies Employee A from viewing Employee B payslip (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userEmployeeA);
      vi.spyOn(payslipsService, 'getPayslipById').mockRejectedValue(
        new (await import('../src/utils/errors.js')).ForbiddenError('You can only access your own payslip')
      );

      const res = await request(app)
        .get('/api/v1/payslips/00000000-0000-0000-0000-000000000999')
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 4. CROSS-TENANT ISOLATION (COMPANY A vs COMPANY B)
  // =========================================================================
  describe('4. Cross-Tenant Isolation Enforcement', () => {
    it('denies HR Manager of Company A from viewing Employee of Company B (403)', async () => {
      const companyBEmployeeId = '00000000-0000-0000-0000-000000000201';
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrManagerA);
      vi.spyOn(employeesService, 'getEmployeeById').mockResolvedValue({
        id: companyBEmployeeId,
        company_id: companyBId, // Belongs to Company B!
        first_name: 'Charlie',
        last_name: 'Brown',
        work_email: 'charlie@companyb.com',
        status: 'ACTIVE'
      } as any);

      const res = await request(app)
        .get(`/api/v1/employees/${companyBEmployeeId}`)
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('another company');
    });

    it('denies HR Manager of Company A from updating Employee of Company B (403)', async () => {
      const companyBEmployeeId = '00000000-0000-0000-0000-000000000201';
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrManagerA);
      vi.spyOn(employeesService, 'getEmployeeById').mockResolvedValue({
        id: companyBEmployeeId,
        company_id: companyBId,
        first_name: 'Charlie',
        last_name: 'Foreign',
        status: 'ACTIVE'
      } as any);

      const res = await request(app)
        .patch(`/api/v1/employees/${companyBEmployeeId}`)
        .set('Authorization', 'Bearer valid-jwt')
        .send({ first_name: 'Charlie Modified' });
      expect(res.status).toBe(403);
    });

    it('denies HR Manager of Company A from viewing Department of Company B (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrManagerA);
      vi.spyOn(departmentsService, 'getDepartmentById').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000022',
        company_id: companyBId,
        name: 'Finance Dept B',
        code: 'FIN-B'
      } as any);

      const res = await request(app)
        .get('/api/v1/departments/00000000-0000-0000-0000-000000000022')
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });

    it('denies HR Manager of Company A from viewing Job Position of Company B (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrManagerA);
      vi.spyOn(positionsService, 'getPositionById').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000033',
        title: 'Lead Architect',
        code: 'ARCH',
        department: { id: 'dept-b', name: 'Dept B', code: 'DB', company_id: companyBId }
      } as any);

      const res = await request(app)
        .get('/api/v1/job-positions/00000000-0000-0000-0000-000000000033')
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });

    it('denies HR Manager of Company A from viewing Schedule of Company B (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrManagerA);
      vi.spyOn(schedulesService, 'getScheduleById').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000044',
        company_id: companyBId,
        name: '40h Company B Schedule'
      } as any);

      const res = await request(app)
        .get('/api/v1/schedules/00000000-0000-0000-0000-000000000044')
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });

    it('denies HR Payroll Manager of Company A from viewing Payrun of Company B (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userPayrollManagerA);
      vi.spyOn(payrollService, 'getPayrunById').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000055',
        company_id: companyBId,
        name: 'September Payroll B',
        status: 'DRAFT'
      } as any);

      const res = await request(app)
        .get('/api/v1/payruns/00000000-0000-0000-0000-000000000055')
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
    });

    it('denies user of Company A from accessing Dashboard KPIs with Company B query param (403)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrManagerA);
      const res = await request(app)
        .get(`/api/v1/dashboard/kpis?companyId=${companyBId}`)
        .set('Authorization', 'Bearer valid-jwt');
      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('another company');
    });

    it('restricts GET /api/v1/companies for non-admin to return ONLY their authorized company', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrManagerA);
      vi.spyOn(companiesService, 'getCompanyById').mockResolvedValue({
        id: companyAId,
        name: 'Company A Corp',
        tax_id: 'TAX-A',
        registration_number: 'REG-A',
        created_at: '2026-01-01',
        updated_at: '2026-01-01'
      } as any);

      const res = await request(app)
        .get('/api/v1/companies')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(companyAId);
    });

    it('allows ADMIN to enumerate all companies (GET /api/v1/companies)', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userAdmin);
      vi.spyOn(companiesService, 'getCompanies').mockResolvedValue([
        { id: companyAId, name: 'Company A' } as any,
        { id: companyBId, name: 'Company B' } as any
      ]);

      const res = await request(app)
        .get('/api/v1/companies')
        .set('Authorization', 'Bearer admin-jwt');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  // =========================================================================
  // 5. UNTRUSTED CLIENT COMPANY_ID MUTATION INJECTION
  // =========================================================================
  describe('5. Client company_id Injection Prevention', () => {
    it('forces authoritative req.user.companyId when non-admin creates employee with spoofed company_id', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrManagerA);
      const createEmployeeSpy = vi.spyOn(employeesService, 'createEmployee').mockResolvedValue({
        id: '00000000-0000-0000-0000-000000000999',
        company_id: companyAId,
        first_name: 'David',
        last_name: 'Miller',
        work_email: 'david@companya.com',
        hire_date: '2026-01-15',
        status: 'ACTIVE'
      } as any);

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', 'Bearer valid-jwt')
        .send({
          company_id: companyBId, // Attempting to inject Company B ID!
          first_name: 'David',
          last_name: 'Miller',
          work_email: 'david@companya.com',
          hire_date: '2026-01-15',
          status: 'ACTIVE'
        });

      expect(res.status).toBe(201);
      expect(createEmployeeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: companyAId // Must be forced to Company A
        }),
        expect.anything()
      );
    });
  });
});

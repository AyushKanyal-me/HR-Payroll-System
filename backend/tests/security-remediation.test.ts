import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { attendanceService } from '../src/modules/attendance/attendance.service.js';
import { employeesService } from '../src/modules/employees/employees.service.js';
import { contractsService } from '../src/modules/contracts/contracts.service.js';
import { timeOffService } from '../src/modules/time-off/time-off.service.js';
import { payrollService } from '../src/modules/payroll/payroll.service.js';
import { payrollRepository } from '../src/modules/payroll/payroll.repository.js';
import { payslipsService } from '../src/modules/payslips/payslips.service.js';
import { AuthenticatedUser } from '../src/types/auth.js';

describe('Security Audit Remediation Test Suite (C-01, C-02, H-01, H-03, H-04, H-05, M-03)', () => {
  const companyAId = '11111111-1111-1111-1111-111111111111';
  const companyBId = '22222222-2222-2222-2222-222222222222';

  const employeeAId = '00000000-0000-0000-0000-000000000101';
  const employeeBId = '00000000-0000-0000-0000-000000000102';

  const userHrA: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000001',
    authUserId: 'auth-user-hr-a',
    email: 'hr@companya.com',
    roles: ['HR_MANAGER'],
    isActive: true,
    companyId: companyAId,
    employeeId: employeeAId
  };

  const userPayrollA: AuthenticatedUser = {
    id: '00000000-0000-0000-0000-000000000002',
    authUserId: 'auth-user-payroll-a',
    email: 'payroll@companya.com',
    roles: ['HR_PAYROLL_MANAGER'],
    isActive: true,
    companyId: companyAId,
    employeeId: '00000000-0000-0000-0000-000000000103'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // C-01 & C-02: Strict Demo Token Whitelisting
  // =========================================================================
  describe('C-01 & C-02: Demo Token Whitelisting & Admin Escalation Prevention', () => {
    it('rejects arbitrary demo tokens beginning with demo_token_* with 401', async () => {
      const response = await request(app)
        .get('/api/v1/companies/current')
        .set('Authorization', 'Bearer demo_token_arbitrary_attacker_1726000000');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toMatch(/Invalid, expired or unrecognized/i);
    });

    it('rejects forged demo tokens without admin elevation', async () => {
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', 'Bearer demo_token_fake_admin');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('authenticates strictly recognized demo tokens', async () => {
      const user = await authService.validateToken('demo_token_admin_001');
      expect(user.roles).toContain('ADMIN');
      expect(user.companyId).toBe('a0000000-0000-0000-0000-000000000001');
    });
  });

  // =========================================================================
  // H-01 & H-04: Pre-Mutation Tenant Authorization (Employees, Attendance, Contracts, Time-Off)
  // =========================================================================
  describe('H-01 & H-04: Pre-mutation Multi-tenant Verification & Mutation Blocking', () => {
    it('blocks updating employee belonging to Company B before calling updateEmployee', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrA);
      
      // Target employee belongs to companyB
      vi.spyOn(employeesService, 'getEmployeeById').mockResolvedValue({
        id: employeeBId,
        company_id: companyBId,
        employee_code: 'EMP-B',
        first_name: 'Bob',
        last_name: 'Foreign',
        work_email: 'bob@companyb.com',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        is_active: true
      } as any);

      const updateSpy = vi.spyOn(employeesService, 'updateEmployee');

      const response = await request(app)
        .patch(`/api/v1/employees/${employeeBId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ first_name: 'Hacked' });

      expect(response.status).toBe(403);
      expect(response.body.error.message).toMatch(/Access denied/i);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('blocks deleting employee belonging to Company B before calling deleteEmployee', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrA);
      
      vi.spyOn(employeesService, 'getEmployeeById').mockResolvedValue({
        id: employeeBId,
        company_id: companyBId,
        employee_code: 'EMP-B',
        first_name: 'Bob',
        last_name: 'Foreign',
        work_email: 'bob@companyb.com',
        employment_type: 'FULL_TIME',
        status: 'ACTIVE',
        is_active: true
      } as any);

      const deleteSpy = vi.spyOn(employeesService, 'deleteEmployee');

      const response = await request(app)
        .delete(`/api/v1/employees/${employeeBId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('blocks updating attendance record belonging to Company B before calling updateAttendance', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrA);

      const attendanceId = '33333333-3333-3333-3333-333333333333';
      vi.spyOn(attendanceService, 'getAttendanceById').mockResolvedValue({
        id: attendanceId,
        employee_id: employeeBId,
        attendance_date: '2026-09-14',
        status: 'PRESENT',
        employee: {
          id: employeeBId,
          company_id: companyBId,
          first_name: 'Foreign',
          last_name: 'User',
          work_email: 'foreign@companyb.com'
        }
      } as any);

      const updateSpy = vi.spyOn(attendanceService, 'updateAttendance');

      const response = await request(app)
        .patch(`/api/v1/attendance/${attendanceId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ status: 'ABSENT' });

      expect(response.status).toBe(403);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('blocks updating contract belonging to Company B before calling updateContract', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrA);

      const contractId = '44444444-4444-4444-4444-444444444444';
      vi.spyOn(contractsService, 'getContractById').mockResolvedValue({
        id: contractId,
        employee_id: employeeBId,
        wage: 100000,
        currency: 'INR',
        status: 'ACTIVE',
        employee: {
          id: employeeBId,
          company_id: companyBId,
          first_name: 'Foreign',
          last_name: 'User',
          work_email: 'foreign@companyb.com'
        }
      } as any);

      const updateSpy = vi.spyOn(contractsService, 'updateContract');

      const response = await request(app)
        .patch(`/api/v1/contracts/${contractId}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ wage: 120000 });

      expect(response.status).toBe(403);
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('blocks approving time-off request belonging to Company B before calling approveRequest', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userHrA);

      const requestId = '55555555-5555-5555-5555-555555555555';
      vi.spyOn(timeOffService, 'getRequestById').mockResolvedValue({
        id: requestId,
        employee_id: employeeBId,
        time_off_type_id: '66666666-6666-6666-6666-666666666666',
        start_date: '2026-09-20',
        end_date: '2026-09-22',
        duration: 3,
        status: 'PENDING',
        employee: {
          id: employeeBId,
          company_id: companyBId,
          first_name: 'Foreign',
          last_name: 'User',
          work_email: 'foreign@companyb.com'
        }
      } as any);

      const approveSpy = vi.spyOn(timeOffService, 'approveRequest');

      const response = await request(app)
        .post(`/api/v1/time-off/requests/${requestId}/approve`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(approveSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // H-03: Payroll Subresources Multi-Tenant Pre-Verification
  // =========================================================================
  describe('H-03: Payroll Subresource Isolation', () => {
    const payrunBId = '77777777-7777-7777-7777-777777777777';

    it('blocks accessing warnings of payrun belonging to Company B with 403', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userPayrollA);

      vi.spyOn(payrollService, 'getPayrunById').mockResolvedValue({
        id: payrunBId,
        company_id: companyBId,
        name: 'Company B Payroll',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        status: 'DRAFT',
        payment_frequency: 'MONTHLY'
      } as any);

      const warningsSpy = vi.spyOn(payrollService, 'getWarnings');

      const response = await request(app)
        .get(`/api/v1/payruns/${payrunBId}/warnings`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(warningsSpy).not.toHaveBeenCalled();
    });

    it('blocks syncing employees to payrun belonging to Company B with 403', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userPayrollA);

      vi.spyOn(payrollService, 'getPayrunById').mockResolvedValue({
        id: payrunBId,
        company_id: companyBId,
        name: 'Company B Payroll',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        status: 'DRAFT',
        payment_frequency: 'MONTHLY'
      } as any);

      const syncSpy = vi.spyOn(payrollService, 'syncAllActiveEmployees');

      const response = await request(app)
        .post(`/api/v1/payruns/${payrunBId}/sync-all`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(syncSpy).not.toHaveBeenCalled();
    });

    it('blocks removing employee from payrun belonging to Company B with 403', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userPayrollA);

      vi.spyOn(payrollService, 'getPayrunById').mockResolvedValue({
        id: payrunBId,
        company_id: companyBId,
        name: 'Company B Payroll',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        status: 'DRAFT',
        payment_frequency: 'MONTHLY'
      } as any);

      const removeSpy = vi.spyOn(payrollService, 'removeEmployeeFromPayrun');

      const response = await request(app)
        .delete(`/api/v1/payruns/${payrunBId}/employees/${employeeAId}`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(removeSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // M-03: Payslip Dispatch Multi-Tenant Authorization
  // =========================================================================
  describe('M-03: Payslip Dispatch Tenant Security', () => {
    const payslipBId = '88888888-8888-8888-8888-888888888888';
    const payrunBId = '77777777-7777-7777-7777-777777777777';

    it('blocks sending email for payslip belonging to Company B with 403', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userPayrollA);

      vi.spyOn(payslipsService, 'getPayslipById').mockResolvedValue({
        id: payslipBId,
        employee_id: employeeBId,
        payrun_id: payrunBId,
        status: 'CONFIRMED',
        employee: {
          id: employeeBId,
          company_id: companyBId,
          first_name: 'Foreign',
          last_name: 'User',
          work_email: 'foreign@companyb.com'
        }
      } as any);

      const sendSpy = vi.spyOn(payslipsService, 'sendPayslipEmail');

      const response = await request(app)
        .post(`/api/v1/payslips/${payslipBId}/send-email`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('blocks bulk sending payslips for payrun belonging to Company B with 403', async () => {
      vi.spyOn(authService, 'validateToken').mockResolvedValue(userPayrollA);

      vi.spyOn(payrollRepository, 'findById').mockResolvedValue({
        id: payrunBId,
        company_id: companyBId,
        name: 'Company B Payroll',
        period_start: '2026-09-01',
        period_end: '2026-09-30',
        status: 'PAID',
        payment_frequency: 'MONTHLY'
      } as any);

      const bulkSpy = vi.spyOn(payslipsService, 'sendBulkPayrunPayslips');

      const response = await request(app)
        .post(`/api/v1/payruns/${payrunBId}/send-payslips`)
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(bulkSpy).not.toHaveBeenCalled();
    });
  });
});

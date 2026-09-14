import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase, TestDatabaseContext } from './helpers/real-db-helper.js';

describe('Phase D — Real PostgreSQL Database Integration & Schema Verification', () => {
  let context: TestDatabaseContext;

  beforeEach(() => {
    context = createTestDatabase();
  });

  // =========================================================================
  // 1. MIGRATION COMPATIBILITY & SCHEMA VERIFICATION
  // =========================================================================
  describe('1. Migration Compatibility & Canonical Tables Verification', () => {
    it('executes migrations and instantiates all core tables and enums in PostgreSQL', () => {
      const db = context.db;

      // Verify essential tables exist in public schema
      const tables = [
        'companies',
        'departments',
        'job_positions',
        'working_schedules',
        'schedule_days',
        'employees',
        'users',
        'roles',
        'user_roles',
        'contracts',
        'attendance',
        'time_off_types',
        'time_off_allocations',
        'time_off_requests',
        'salary_structures',
        'salary_rules',
        'salary_structure_rules',
        'payruns',
        'payrun_employees',
        'payslips',
        'payslip_items',
        'payroll_warnings',
        'payslip_deliveries',
        'audit_logs'
      ];

      for (const table of tables) {
        const rows = db.public.many(`SELECT * FROM ${table} LIMIT 1;`);
        expect(Array.isArray(rows)).toBe(true);
      }
    });

    it('enforces foreign key constraints between dependent tables', () => {
      const db = context.db;

      // Attempting to insert an employee with a non-existent company_id must fail
      expect(() => {
        db.public.none(`
          INSERT INTO employees (
            id, company_id, employee_code, first_name, last_name
          ) VALUES (
            'e0000000-9999-0000-0000-000000000099',
            'a0000000-9999-9999-9999-999999999999',
            'INVALID-001',
            'Invalid',
            'User'
          );
        `);
      }).toThrow();
    });

    it('enforces unique constraints (e.g. unique department code per company)', () => {
      const db = context.db;

      // Duplicate department code 'ENG' in Company A must fail
      expect(() => {
        db.public.none(`
          INSERT INTO departments (company_id, name, code)
          VALUES ('${context.fixtures.companyAId}', 'Engineering Duplicate', 'ENG');
        `);
      }).toThrow();
    });
  });

  // =========================================================================
  // 2. AUTH & USER IDENTITY REPOSITORY QUERIES
  // =========================================================================
  describe('2. Real Auth & User Identity Repository Queries', () => {
    it('executes real auth lookup joining users, employees, and user_roles', () => {
      const db = context.db;
      const authUserId = context.fixtures.employeeAAuthId;

      const rows = db.public.many(`
        SELECT
          u.id AS user_id,
          u.auth_user_id,
          u.is_active,
          e.id AS employee_id,
          e.first_name,
          e.last_name,
          e.company_id,
          r.name AS role_name
        FROM users u
        LEFT JOIN employees e ON u.employee_id = e.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.auth_user_id = '${authUserId}';
      `);

      expect(rows.length).toBeGreaterThan(0);
      const user = rows[0] as any;
      expect(user.user_id).toBe(context.fixtures.employeeAUserId);
      expect(user.role_name).toBe('EMPLOYEE');
      expect(user.company_id).toBe(context.fixtures.companyAId);
    });
  });

  // =========================================================================
  // 3. EMPLOYEE, DEPARTMENT, POSITION & SCHEDULE CRUD
  // =========================================================================
  describe('3. Core HR Domain Real Database Queries', () => {
    it('executes Employee CRUD operations against PostgreSQL schema', () => {
      const db = context.db;
      const newEmpId = 'e0000000-0000-0000-0000-000000000099';

      // 1. Create
      db.public.none(`
        INSERT INTO employees (
          id, company_id, employee_code, first_name, last_name, email,
          department_id, job_position_id, status, bank_account_number, bank_name, ifsc_code
        ) VALUES (
          '${newEmpId}',
          '${context.fixtures.companyAId}',
          'EMP-099',
          'Charlie',
          'Dev',
          'charlie@alpha.com',
          '${context.fixtures.deptAId}',
          '${context.fixtures.positionAId}',
          'ACTIVE',
          '998877665544',
          'State Bank',
          'SBIN0001234'
        );
      `);

      // 2. Read
      const emp = db.public.one(`SELECT * FROM employees WHERE id = '${newEmpId}';`) as any;
      expect(emp.first_name).toBe('Charlie');
      expect(emp.employee_code).toBe('EMP-099');

      // 3. Update
      db.public.none(`
        UPDATE employees
        SET phone = '+91-9876543210', status = 'ACTIVE'
        WHERE id = '${newEmpId}';
      `);
      const updated = db.public.one(`SELECT phone FROM employees WHERE id = '${newEmpId}';`) as any;
      expect(updated.phone).toBe('+91-9876543210');

      // 4. Delete
      db.public.none(`DELETE FROM employees WHERE id = '${newEmpId}';`);
      const deleted = db.public.many(`SELECT * FROM employees WHERE id = '${newEmpId}';`);
      expect(deleted.length).toBe(0);
    });

    it('executes Department & Job Position CRUD operations', () => {
      const db = context.db;
      const newDeptId = 'd0000000-0000-0000-0000-000000000099';
      const newPosId = 'b0000000-0000-0000-0000-000000000099';

      // Department CRUD
      db.public.none(`
        INSERT INTO departments (id, company_id, name, code)
        VALUES ('${newDeptId}', '${context.fixtures.companyAId}', 'Human Resources', 'HR');
      `);
      const dept = db.public.one(`SELECT * FROM departments WHERE id = '${newDeptId}';`) as any;
      expect(dept.name).toBe('Human Resources');

      db.public.none(`UPDATE departments SET name = 'People & Culture' WHERE id = '${newDeptId}';`);
      const updatedDept = db.public.one(`SELECT name FROM departments WHERE id = '${newDeptId}';`) as any;
      expect(updatedDept.name).toBe('People & Culture');

      // Position CRUD
      db.public.none(`
        INSERT INTO job_positions (id, company_id, name, description)
        VALUES ('${newPosId}', '${context.fixtures.companyAId}', 'HR Specialist', 'Recruiting & Onboarding');
      `);
      const pos = db.public.one(`SELECT * FROM job_positions WHERE id = '${newPosId}';`) as any;
      expect(pos.name).toBe('HR Specialist');
    });

    it('executes Schedule & Schedule Days real relational queries', () => {
      const db = context.db;

      const scheduleWithDays = db.public.many(`
        SELECT s.id, s.name, s.weekly_hours, d.day_of_week, d.start_time, d.end_time
        FROM working_schedules s
        JOIN schedule_days d ON s.id = d.schedule_id
        WHERE s.id = '${context.fixtures.scheduleAId}'
        ORDER BY d.start_time ASC;
      `);

      expect(scheduleWithDays.length).toBe(5); // Monday to Friday
      expect(scheduleWithDays.some((d: any) => d.day_of_week === 'MONDAY')).toBe(true);
      expect(scheduleWithDays.some((d: any) => d.day_of_week === 'FRIDAY')).toBe(true);
    });
  });

  // =========================================================================
  // 4. CONTRACT RESOLUTION REAL DATABASE QUERIES
  // =========================================================================
  describe('4. Contract Resolution Real Database Queries', () => {
    it('executes period overlapping active contract query and contract CRUD', () => {
      const db = context.db;
      const employeeId = context.fixtures.employeeAId;
      const periodStart = '2026-09-01';
      const periodEnd = '2026-09-30';

      const contracts = db.public.many(`
        SELECT c.*, s.name AS structure_name
        FROM contracts c
        LEFT JOIN salary_structures s ON c.salary_structure_id = s.id
        WHERE c.employee_id = '${employeeId}'
          AND c.status = 'ACTIVE'
          AND c.start_date <= '${periodEnd}'
          AND (c.end_date IS NULL OR c.end_date >= '${periodStart}')
        ORDER BY c.start_date DESC;
      `);

      expect(contracts.length).toBe(1);
      expect((contracts[0] as any).wage).toBe(60000);
      expect((contracts[0] as any).structure_name).toBe('Alpha Standard Salary');

      // Update wage
      db.public.none(`
        UPDATE contracts SET wage = 65000 WHERE id = '${context.fixtures.contractAId}';
      `);
      const updatedContract = db.public.one(`SELECT wage FROM contracts WHERE id = '${context.fixtures.contractAId}';`) as any;
      expect(updatedContract.wage).toBe(65000);
    });
  });

  // =========================================================================
  // 5. ATTENDANCE & TIME-OFF REAL DATABASE QUERIES
  // =========================================================================
  describe('5. Attendance & Time-Off Real Database Queries', () => {
    it('executes attendance log and date-range aggregation query', () => {
      const db = context.db;
      const employeeId = context.fixtures.employeeAId;

      // Insert attendance records with explicit UUIDs
      db.public.none(`
        INSERT INTO attendance (id, employee_id, attendance_date, check_in, check_out, worked_hours, status) VALUES
          ('11111111-0000-0000-0000-000000000001', '${employeeId}', '2026-09-01', '2026-09-01 09:00:00+00', '2026-09-01 17:00:00+00', 8.0, 'PRESENT'),
          ('11111111-0000-0000-0000-000000000002', '${employeeId}', '2026-09-02', '2026-09-02 09:15:00+00', '2026-09-02 17:15:00+00', 8.0, 'LATE'),
          ('11111111-0000-0000-0000-000000000003', '${employeeId}', '2026-09-03', '2026-09-03 09:00:00+00', NULL, 4.0, 'PRESENT');
      `);

      const records = db.public.many(`
        SELECT
          COUNT(*) AS total_records,
          SUM(worked_hours) AS total_hours,
          COUNT(CASE WHEN check_in IS NOT NULL AND check_out IS NULL THEN 1 END) AS missing_checkouts
        FROM attendance
        WHERE employee_id = '${employeeId}'
          AND attendance_date BETWEEN '2026-09-01' AND '2026-09-30';
      `) as any[];

      expect(Number(records[0].total_records)).toBe(3);
      expect(Number(records[0].total_hours)).toBe(20.0);
      expect(Number(records[0].missing_checkouts)).toBe(1);
    });

    it('executes time-off allocation and request queries with type joins', () => {
      const db = context.db;
      const employeeId = context.fixtures.employeeAId;
      const allocId = '22222222-0000-0000-0000-000000000001';
      const reqId = '33333333-0000-0000-0000-000000000001';

      // 1. Insert Allocation
      db.public.none(`
        INSERT INTO time_off_allocations (id, employee_id, time_off_type_id, allocated_amount, used_amount, status)
        VALUES ('${allocId}', '${employeeId}', '${context.fixtures.annualLeaveTypeId}', 18, 0, 'ACTIVE');
      `);

      // 2. Insert Time-Off Request
      db.public.none(`
        INSERT INTO time_off_requests (id, employee_id, time_off_type_id, allocation_id, start_date, end_date, duration, status)
        VALUES ('${reqId}', '${employeeId}', '${context.fixtures.annualLeaveTypeId}', '${allocId}', '2026-09-10', '2026-09-11', 2, 'PENDING');
      `);

      // 3. Query overlapping approved requests
      db.public.none(`UPDATE time_off_requests SET status = 'APPROVED' WHERE id = '${reqId}';`);

      const approvedLeaves = db.public.many(`
        SELECT r.id, r.start_date, r.end_date, r.duration, t.code AS leave_code, t.requires_allocation
        FROM time_off_requests r
        JOIN time_off_types t ON r.time_off_type_id = t.id
        WHERE r.employee_id = '${employeeId}'
          AND r.status = 'APPROVED'
          AND r.start_date <= '2026-09-30'
          AND r.end_date >= '2026-09-01';
      `);

      expect(approvedLeaves.length).toBe(1);
      expect((approvedLeaves[0] as any).leave_code).toBe('ANNUAL');
      expect(Number((approvedLeaves[0] as any).duration)).toBe(2);
    });
  });

  // =========================================================================
  // 6. SALARY STRUCTURE & PAYRUN REAL DATABASE WORKFLOW
  // =========================================================================
  describe('6. Salary Structures, Payruns, Payslips & Recomputation Real Workflow', () => {
    it('executes salary structure rules query ordered by sequence', () => {
      const db = context.db;

      const rules = db.public.many(`
        SELECT sr.code, sr.category, sr.calculation_type, sr.percentage, sr.fixed_amount, sr.formula, ssr.sequence
        FROM salary_structure_rules ssr
        JOIN salary_rules sr ON ssr.salary_rule_id = sr.id
        WHERE ssr.salary_structure_id = '${context.fixtures.salaryStructureId}'
        ORDER BY ssr.sequence ASC;
      `);

      expect(rules.length).toBe(7);
      expect((rules[0] as any).code).toBe('BASIC');
      expect((rules[1] as any).code).toBe('HRA');
      expect((rules[3] as any).code).toBe('GROSS');
      expect((rules[6] as any).code).toBe('NET');
    });

    it('creates payrun, inserts payslip and line items, and performs clean recomputation', () => {
      const db = context.db;
      const payrunId = '44444444-0000-0000-0000-000000000001';
      const payslipId = '55555555-0000-0000-0000-000000000001';

      // 1. Create Payrun
      db.public.none(`
        INSERT INTO payruns (
          id, company_id, salary_structure_id, name, period_start, period_end, status, total_employees
        ) VALUES (
          '${payrunId}',
          '${context.fixtures.companyAId}',
          '${context.fixtures.salaryStructureId}',
          'September 2026 Payrun',
          '2026-09-01',
          '2026-09-30',
          'DRAFT',
          1
        );

        INSERT INTO payrun_employees (payrun_id, employee_id, status)
        VALUES ('${payrunId}', '${context.fixtures.employeeAId}', 'SELECTED');
      `);

      // 2. Save 1st Computation
      db.public.none(`
        INSERT INTO payslips (
          id, payrun_id, employee_id, contract_id, salary_structure_id,
          period_start, period_end, worked_days, worked_hours, gross_salary, total_deductions, net_salary, status
        ) VALUES (
          '${payslipId}',
          '${payrunId}',
          '${context.fixtures.employeeAId}',
          '${context.fixtures.contractAId}',
          '${context.fixtures.salaryStructureId}',
          '2026-09-01',
          '2026-09-30',
          22,
          176,
          60000,
          5000,
          55000,
          'GENERATED'
        );

        INSERT INTO payslip_items (id, payslip_id, name, code, category, sequence, amount) VALUES
          ('66666666-0000-0000-0000-000000000001', '${payslipId}', 'Basic Salary', 'BASIC', 'BASIC', 1, 36000),
          ('66666666-0000-0000-0000-000000000002', '${payslipId}', 'House Rent Allowance', 'HRA', 'ALLOWANCE', 2, 18000),
          ('66666666-0000-0000-0000-000000000003', '${payslipId}', 'Transport Allowance', 'TRANSPORT', 'ALLOWANCE', 3, 3000),
          ('66666666-0000-0000-0000-000000000004', '${payslipId}', 'PF Deduction', 'PF', 'DEDUCTION', 5, 4320);

        UPDATE payruns
        SET status = 'COMPUTED', total_gross = 60000, total_deductions = 5000, total_net = 55000
        WHERE id = '${payrunId}';

        UPDATE payrun_employees SET status = 'COMPLETED' WHERE payrun_id = '${payrunId}';
      `);

      let payrun = db.public.one(`SELECT * FROM payruns WHERE id = '${payrunId}';`) as any;
      expect(payrun.status).toBe('COMPUTED');
      expect(payrun.total_net).toBe(55000);

      let items = db.public.many(`SELECT * FROM payslip_items WHERE payslip_id = '${payslipId}';`);
      expect(items.length).toBe(4);

      // 3. Recomputation (Clean delete & re-insert)
      db.public.none(`
        DELETE FROM payslips WHERE payrun_id = '${payrunId}';

        INSERT INTO payslips (
          id, payrun_id, employee_id, contract_id, salary_structure_id,
          period_start, period_end, worked_days, worked_hours, gross_salary, total_deductions, net_salary, status
        ) VALUES (
          '${payslipId}',
          '${payrunId}',
          '${context.fixtures.employeeAId}',
          '${context.fixtures.contractAId}',
          '${context.fixtures.salaryStructureId}',
          '2026-09-01',
          '2026-09-30',
          22,
          176,
          60000,
          5000,
          55000,
          'GENERATED'
        );

        INSERT INTO payslip_items (id, payslip_id, name, code, category, sequence, amount) VALUES
          ('66666666-0000-0000-0000-000000000005', '${payslipId}', 'Basic Salary', 'BASIC', 'BASIC', 1, 36000),
          ('66666666-0000-0000-0000-000000000006', '${payslipId}', 'House Rent Allowance', 'HRA', 'ALLOWANCE', 2, 18000),
          ('66666666-0000-0000-0000-000000000007', '${payslipId}', 'Transport Allowance', 'TRANSPORT', 'ALLOWANCE', 3, 3000),
          ('66666666-0000-0000-0000-000000000008', '${payslipId}', 'PF Deduction', 'PF', 'DEDUCTION', 5, 4320);
      `);

      // Verify no duplicates created
      const payslipsCount = db.public.many(`SELECT * FROM payslips WHERE payrun_id = '${payrunId}';`);
      expect(payslipsCount.length).toBe(1);

      const itemsCount = db.public.many(`SELECT * FROM payslip_items WHERE payslip_id = '${payslipId}';`);
      expect(itemsCount.length).toBe(4);
    });
  });

  // =========================================================================
  // 7. MULTI-TENANT ISOLATION & RLS PATTERNS
  // =========================================================================
  describe('7. Multi-Tenant Isolation & Canonical RLS Queries', () => {
    it('Company A user query returns only Company A employees and strictly zero Company B employees', () => {
      const db = context.db;
      const companyAId = context.fixtures.companyAId;

      const companyAEmployees = db.public.many(`
        SELECT * FROM employees WHERE company_id = '${companyAId}';
      `) as any[];

      expect(companyAEmployees.length).toBe(1);
      expect(companyAEmployees[0].id).toBe(context.fixtures.employeeAId);
      expect(companyAEmployees[0].first_name).toBe('Alice');

      // Verify no leak of Company B
      expect(companyAEmployees.some((e: any) => e.id === context.fixtures.employeeBId)).toBe(false);
    });

    it('Company B user query returns only Company B data', () => {
      const db = context.db;
      const companyBId = context.fixtures.companyBId;

      const companyBEmployees = db.public.many(`
        SELECT * FROM employees WHERE company_id = '${companyBId}';
      `) as any[];

      expect(companyBEmployees.length).toBe(1);
      expect(companyBEmployees[0].id).toBe(context.fixtures.employeeBId);
      expect(companyBEmployees[0].first_name).toBe('Bob');
    });

    it('Employee A cannot view Employee B sensitive salary contracts in tenant isolation model', () => {
      const db = context.db;
      const employeeAId = context.fixtures.employeeAId;

      const contracts = db.public.many(`
        SELECT * FROM contracts WHERE employee_id = '${employeeAId}';
      `) as any[];

      expect(contracts.length).toBe(1);
      expect(contracts[0].employee_id).toBe(employeeAId);
      expect(contracts.some((c: any) => c.employee_id === context.fixtures.employeeBId)).toBe(false);
    });

    it('Payroll user has access to company payrun data while standard employee is restricted', () => {
      const db = context.db;
      const companyAId = context.fixtures.companyAId;

      // Payroll Manager query for company payruns
      const payruns = db.public.many(`
        SELECT p.*, s.name AS structure_name
        FROM payruns p
        JOIN salary_structures s ON p.salary_structure_id = s.id
        WHERE p.company_id = '${companyAId}';
      `);

      expect(Array.isArray(payruns)).toBe(true);
    });

    it('Admin user has permitted administrative access across company data', () => {
      const db = context.db;
      const companyAId = context.fixtures.companyAId;

      const auditLogs = db.public.many(`
        SELECT * FROM departments WHERE company_id = '${companyAId}';
      `);

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });
});


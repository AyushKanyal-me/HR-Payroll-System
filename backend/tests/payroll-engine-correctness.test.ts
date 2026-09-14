import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollEngine } from '../src/modules/payroll/engine/PayrollEngine.js';
import { SafeFormulaEvaluator } from '../src/modules/salary/salary.evaluator.js';
import { WorkingDaysCalculator } from '../src/modules/payroll/engine/WorkingDaysCalculator.js';
import { DeductionCalculator } from '../src/modules/payroll/engine/DeductionCalculator.js';
import { WarningDetector } from '../src/modules/payroll/engine/WarningDetector.js';
import { SalaryRuleEvaluator } from '../src/modules/payroll/engine/SalaryRuleEvaluator.js';
import { PayrollRepository } from '../src/modules/payroll/payroll.repository.js';
import { Employee } from '../src/modules/employees/employees.types.js';
import { SalaryStructure, SalaryRule } from '../src/modules/salary/salary.types.js';
import { Contract } from '../src/modules/contracts/contracts.types.js';

describe('Phase C — Payroll Engine Correctness & Transaction Safety Test Suite', () => {
  // Deterministic Mock Data
  const sampleEmployeeA: Employee = {
    id: 'emp-001',
    company_id: 'comp-001',
    first_name: 'Employee',
    last_name: 'A',
    work_email: 'employee.a@peoplepay360.com',
    personal_email: null,
    phone: null,
    hire_date: '2025-01-01',
    employment_type: 'FULL_TIME',
    status: 'ACTIVE',
    bank_account_number: '123456789012',
    bank_name: 'HDFC Bank',
    bank_ifsc: 'HDFC0001234',
    pan_number: 'ABCDE1234F',
    aadhaar_number: '123456789012',
    department_id: null,
    job_position_id: null,
    manager_id: null,
    schedule_id: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  const sampleEmployeeB: Employee = {
    id: 'emp-002',
    company_id: 'comp-001',
    first_name: 'Employee',
    last_name: 'B',
    work_email: 'employee.b@peoplepay360.com',
    personal_email: null,
    phone: null,
    hire_date: '2025-01-01',
    employment_type: 'FULL_TIME',
    status: 'ACTIVE',
    bank_account_number: '987654321098',
    bank_name: 'ICICI Bank',
    bank_ifsc: 'ICIC0005678',
    pan_number: 'FGHIJ5678K',
    aadhaar_number: '987654321098',
    department_id: null,
    job_position_id: null,
    manager_id: null,
    schedule_id: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  // Salary Rules
  const ruleBasic: SalaryRule = {
    id: 'rule-01',
    name: 'Basic Salary',
    code: 'BASIC',
    category: 'BASIC',
    calculation_type: 'FIXED',
    fixed_amount: 30000,
    percentage: null,
    formula: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  const ruleHra: SalaryRule = {
    id: 'rule-02',
    name: 'House Rent Allowance',
    code: 'HRA',
    category: 'ALLOWANCE',
    calculation_type: 'FIXED',
    fixed_amount: 12000,
    percentage: null,
    formula: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  const ruleTransport: SalaryRule = {
    id: 'rule-03',
    name: 'Transport Allowance',
    code: 'TRANSPORT',
    category: 'ALLOWANCE',
    calculation_type: 'FIXED',
    fixed_amount: 3000,
    percentage: null,
    formula: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  const ruleGross: SalaryRule = {
    id: 'rule-04',
    name: 'Gross Salary',
    code: 'GROSS',
    category: 'GROSS',
    calculation_type: 'FORMULA',
    fixed_amount: null,
    percentage: null,
    formula: 'BASIC + HRA + TRANSPORT',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  const rulePf: SalaryRule = {
    id: 'rule-05',
    name: 'Provident Fund',
    code: 'PF',
    category: 'DEDUCTION',
    calculation_type: 'PERCENTAGE',
    fixed_amount: null,
    percentage: 12,
    formula: 'BASIC',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  const ruleProfTax: SalaryRule = {
    id: 'rule-06',
    name: 'Professional Tax',
    code: 'PROFESSIONAL_TAX',
    category: 'DEDUCTION',
    calculation_type: 'FIXED',
    fixed_amount: 200,
    percentage: null,
    formula: null,
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  const ruleNet: SalaryRule = {
    id: 'rule-07',
    name: 'Net Salary',
    code: 'NET',
    category: 'NET',
    calculation_type: 'FORMULA',
    fixed_amount: null,
    percentage: null,
    formula: 'GROSS - PF - PROFESSIONAL_TAX',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z'
  };

  const standardSalaryStructure: SalaryStructure = {
    id: 'struct-001',
    company_id: 'comp-001',
    name: 'Standard Structure',
    code: 'STD_STRUCT',
    description: 'Standard Test Structure',
    is_active: true,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
    rules: [
      { id: 'sr-1', salary_structure_id: 'struct-001', salary_rule_id: 'rule-01', sequence: 1, rule: ruleBasic },
      { id: 'sr-2', salary_structure_id: 'struct-001', salary_rule_id: 'rule-02', sequence: 2, rule: ruleHra },
      { id: 'sr-3', salary_structure_id: 'struct-001', salary_rule_id: 'rule-03', sequence: 3, rule: ruleTransport },
      { id: 'sr-4', salary_structure_id: 'struct-001', salary_rule_id: 'rule-04', sequence: 4, rule: ruleGross },
      { id: 'sr-5', salary_structure_id: 'struct-001', salary_rule_id: 'rule-05', sequence: 5, rule: rulePf },
      { id: 'sr-6', salary_structure_id: 'struct-001', salary_rule_id: 'rule-06', sequence: 6, rule: ruleProfTax },
      { id: 'sr-7', salary_structure_id: 'struct-001', salary_rule_id: 'rule-07', sequence: 7, rule: ruleNet }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Employee A Fixture & Standard Calculation
  // =========================================================================
  describe('1. Employee A Deterministic Fixture & Salary Rules Evaluation', () => {
    it('calculates Employee A: Basic 30k, HRA 12k, Transport 3k => Gross 45k, PF 3.6k, PT 200 => Net 41.2k', () => {
      const evaluator = new SalaryRuleEvaluator();
      const rules = standardSalaryStructure.rules!.map((r) => ({
        rule: r.rule,
        sequence: r.sequence
      }));

      const result = evaluator.evaluateSequence(rules, { WAGE: 45000 });

      expect(result.gross).toBe(45000);
      expect(result.finalContext['BASIC']).toBe(30000);
      expect(result.finalContext['HRA']).toBe(12000);
      expect(result.finalContext['TRANSPORT']).toBe(3000);
      expect(result.finalContext['PF']).toBe(3600); // 12% of 30,000 = 3,600
      expect(result.finalContext['PROFESSIONAL_TAX']).toBe(200);
      expect(result.deductions).toBe(3800); // 3600 + 200
      expect(result.net).toBe(41200); // 45000 - 3800
    });
  });

  // =========================================================================
  // 2. Formula Validation & Security
  // =========================================================================
  describe('2. Formula Validation and AST Security', () => {
    it('accepts valid formulas: 10 + 5, BASIC * 0.4, (BASIC + HRA) * 0.12', () => {
      expect(SafeFormulaEvaluator.validateFormulaSyntax('10 + 5')).toBe(true);
      expect(SafeFormulaEvaluator.validateFormulaSyntax('BASIC * 0.4')).toBe(true);
      expect(SafeFormulaEvaluator.validateFormulaSyntax('(BASIC + HRA) * 0.12')).toBe(true);
      expect(SafeFormulaEvaluator.validateFormulaSyntax('GROSS - (PF + PROFESSIONAL_TAX)')).toBe(true);
    });

    it('rejects malformed syntax: 10 + * 5, BASIC !!!, unclosed parentheses, trailing operators', () => {
      expect(SafeFormulaEvaluator.validateFormulaSyntax('10 + * 5')).toBe(false);
      expect(SafeFormulaEvaluator.validateFormulaSyntax('BASIC !!!')).toBe(false);
      expect(SafeFormulaEvaluator.validateFormulaSyntax('(BASIC + HRA')).toBe(false);
      expect(SafeFormulaEvaluator.validateFormulaSyntax('BASIC +')).toBe(false);
      expect(SafeFormulaEvaluator.validateFormulaSyntax('* 5')).toBe(false);
      expect(SafeFormulaEvaluator.validateFormulaSyntax('')).toBe(false);
    });

    it('rejects unknown variables when allowed variable list is enforced', () => {
      expect(() => {
        SafeFormulaEvaluator.validate('BASIC + unknownVariable', ['BASIC', 'HRA', 'GROSS']);
      }).toThrow(/Unknown identifier 'UNKNOWNVARIABLE'/);
    });

    it('evaluates expressions safely and rejects division by zero without using eval', () => {
      const res = SafeFormulaEvaluator.evaluate('BASIC * 0.4 + HRA / 2', {
        BASIC: 30000,
        HRA: 10000
      });
      expect(res).toBe(17000); // 12000 + 5000

      expect(() => {
        SafeFormulaEvaluator.evaluate('BASIC / 0', { BASIC: 30000 });
      }).toThrow(/Division by zero/);
    });
  });

  // =========================================================================
  // 3. Contract Resolution & Proration
  // =========================================================================
  describe('3. Contract Resolution & Partial Period Proration', () => {
    it('prorates salary when contract only covers partial period (starts mid-month)', async () => {
      const engine = new PayrollEngine();

      // Mock contract starting on Sep 16 in a 22-working-day month
      const partialContract: Contract = {
        id: 'contract-part-1',
        employee_id: sampleEmployeeA.id,
        salary_structure_id: standardSalaryStructure.id,
        schedule_id: null,
        wage: 44000,
        start_date: '2026-09-16', // starts mid-September (11 working days out of 22)
        end_date: null,
        status: 'ACTIVE',
        created_at: '2026-09-01T00:00:00.000Z',
        updated_at: '2026-09-01T00:00:00.000Z'
      };

      // Mock percentage based salary structure that uses WAGE
      const proratedStructure: SalaryStructure = {
        ...standardSalaryStructure,
        rules: [
          {
            id: 'sr-p1',
            salary_structure_id: 'struct-001',
            salary_rule_id: 'rule-01',
            sequence: 1,
            rule: {
              ...ruleBasic,
              calculation_type: 'PERCENTAGE',
              percentage: 100,
              formula: 'WAGE'
            }
          }
        ]
      };

      // Spy on resolver
      vi.spyOn(engine['contractResolver'], 'resolve').mockResolvedValue(partialContract);
      vi.spyOn(engine['attendanceCalc'], 'calculate').mockResolvedValue({
        actualWorkedDays: 11,
        actualWorkedHours: 88,
        missingCheckouts: 0
      });
      vi.spyOn(engine['leaveCalc'], 'calculate').mockResolvedValue({
        approvedPaidLeaveDays: 0,
        approvedUnpaidLeaveDays: 0
      });

      const result = await engine.computeEmployee(
        'payrun-001',
        sampleEmployeeA,
        proratedStructure,
        '2026-09-01',
        '2026-09-30'
      );

      expect(result.success).toBe(true);
      expect(result.payslip).toBeDefined();
      // Total working days in Sept 2026 = 22. Contract active days (16-30) = 11.
      // Prorated wage = 44000 * (11/22) = 22000
      expect(result.payslip?.grossSalary).toBe(22000);
      expect(result.payslip?.netSalary).toBe(22000);
    });

    it('does not pay zero simply because contract ends before periodEnd', async () => {
      const engine = new PayrollEngine();

      const contractEndingMidMonth: Contract = {
        id: 'contract-part-2',
        employee_id: sampleEmployeeA.id,
        salary_structure_id: standardSalaryStructure.id,
        schedule_id: null,
        wage: 44000,
        start_date: '2026-01-01',
        end_date: '2026-09-15', // ends mid-September (11 working days)
        status: 'ACTIVE',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      };

      const proratedStructure: SalaryStructure = {
        ...standardSalaryStructure,
        rules: [
          {
            id: 'sr-p1',
            salary_structure_id: 'struct-001',
            salary_rule_id: 'rule-01',
            sequence: 1,
            rule: {
              ...ruleBasic,
              calculation_type: 'PERCENTAGE',
              percentage: 100,
              formula: 'WAGE'
            }
          }
        ]
      };

      vi.spyOn(engine['contractResolver'], 'resolve').mockResolvedValue(contractEndingMidMonth);
      vi.spyOn(engine['attendanceCalc'], 'calculate').mockResolvedValue({
        actualWorkedDays: 11,
        actualWorkedHours: 88,
        missingCheckouts: 0
      });
      vi.spyOn(engine['leaveCalc'], 'calculate').mockResolvedValue({
        approvedPaidLeaveDays: 0,
        approvedUnpaidLeaveDays: 0
      });

      const result = await engine.computeEmployee(
        'payrun-001',
        sampleEmployeeA,
        proratedStructure,
        '2026-09-01',
        '2026-09-30'
      );

      expect(result.success).toBe(true);
      expect(result.payslip?.grossSalary).toBe(22000);
    });
  });

  // =========================================================================
  // 4. Working Schedule & Timezone Safety
  // =========================================================================
  describe('4. Working Schedule & Timezone-Safe Calculations', () => {
    it('uses employee schedule_days (e.g. 4-day work week Tue-Fri) instead of standard Mon-Fri', () => {
      const calc = new WorkingDaysCalculator();
      // Custom 4-day schedule: Tuesday, Wednesday, Thursday, Friday
      const customSchedule = ['TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      const { workingDays, totalPeriodDays } = calc.calculate('2026-09-01', '2026-09-30', customSchedule);

      expect(totalPeriodDays).toBe(30);
      // In Sept 2026: 4 Tuesdays, 5 Wednesdays, 4 Thursdays, 4 Fridays = 17 working days
      expect(workingDays).toBe(18); // Sep 1 is Tue, Sep 30 is Wed
    });

    it('calculates deterministic working days regardless of timezone offsets', () => {
      const calc = new WorkingDaysCalculator();
      const res1 = calc.calculate('2026-09-01', '2026-09-30', ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
      const res2 = calc.calculate('2026-09-01T00:00:00.000Z', '2026-09-30T23:59:59.999Z', ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);

      expect(res1.workingDays).toBe(22);
      expect(res2.workingDays).toBe(22);
    });
  });

  // =========================================================================
  // 5. Leave Overlap & Unpaid Deduction Line Items
  // =========================================================================
  describe('5. Leave Overlap & Unpaid Leave Deduction in Payslips', () => {
    it('unpaid leave deduction generates UNPAID_LEAVE deduction item and reduces net salary', async () => {
      const engine = new PayrollEngine();

      const contract: Contract = {
        id: 'contract-001',
        employee_id: sampleEmployeeA.id,
        salary_structure_id: standardSalaryStructure.id,
        schedule_id: null,
        wage: 44000,
        start_date: '2025-01-01',
        end_date: null,
        status: 'ACTIVE',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      vi.spyOn(engine['contractResolver'], 'resolve').mockResolvedValue(contract);
      vi.spyOn(engine['attendanceCalc'], 'calculate').mockResolvedValue({
        actualWorkedDays: 20,
        actualWorkedHours: 160,
        missingCheckouts: 0
      });
      // 2 days unpaid leave in a 22-day month
      vi.spyOn(engine['leaveCalc'], 'calculate').mockResolvedValue({
        approvedPaidLeaveDays: 0,
        approvedUnpaidLeaveDays: 2
      });

      const result = await engine.computeEmployee(
        'payrun-001',
        sampleEmployeeA,
        standardSalaryStructure,
        '2026-09-01',
        '2026-09-30'
      );

      expect(result.success).toBe(true);
      expect(result.payslip).toBeDefined();

      // 44,000 / 22 * 2 = 4,000 unpaid deduction
      const unpaidItem = result.payslip?.items.find((it) => it.code === 'UNPAID_LEAVE');
      expect(unpaidItem).toBeDefined();
      expect(unpaidItem?.amount).toBe(4000);
      expect(unpaidItem?.category).toBe('DEDUCTION');

      // Gross = 45,000, Standard Deductions = 3,800 + Unpaid Deduction = 4,000 -> Total Deductions = 7,800
      expect(result.payslip?.totalDeductions).toBe(7800);
      expect(result.payslip?.netSalary).toBe(37200); // 45,000 - 7,800
    });

    it('approved paid leave does NOT deduct salary', async () => {
      const engine = new PayrollEngine();

      const contract: Contract = {
        id: 'contract-001',
        employee_id: sampleEmployeeA.id,
        salary_structure_id: standardSalaryStructure.id,
        schedule_id: null,
        wage: 44000,
        start_date: '2025-01-01',
        end_date: null,
        status: 'ACTIVE',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      vi.spyOn(engine['contractResolver'], 'resolve').mockResolvedValue(contract);
      vi.spyOn(engine['attendanceCalc'], 'calculate').mockResolvedValue({
        actualWorkedDays: 17,
        actualWorkedHours: 136,
        missingCheckouts: 0
      });
      // 5 days approved paid leave
      vi.spyOn(engine['leaveCalc'], 'calculate').mockResolvedValue({
        approvedPaidLeaveDays: 5,
        approvedUnpaidLeaveDays: 0
      });

      const result = await engine.computeEmployee(
        'payrun-001',
        sampleEmployeeA,
        standardSalaryStructure,
        '2026-09-01',
        '2026-09-30'
      );

      expect(result.success).toBe(true);
      const unpaidItem = result.payslip?.items.find((it) => it.code === 'UNPAID_LEAVE');
      expect(unpaidItem).toBeUndefined();
      expect(result.payslip?.netSalary).toBe(41200);
    });
  });

  // =========================================================================
  // 6. Warning Detection & Missing Contract
  // =========================================================================
  describe('6. Warning Detection & Missing Contract Failure', () => {
    it('marks employee computation as FAILED with MISSING_CONTRACT warning when no contract exists', async () => {
      const engine = new PayrollEngine();

      vi.spyOn(engine['contractResolver'], 'resolve').mockResolvedValue(null);

      const result = await engine.computeEmployee(
        'payrun-001',
        sampleEmployeeA,
        standardSalaryStructure,
        '2026-09-01',
        '2026-09-30'
      );

      expect(result.success).toBe(false);
      expect(result.payslip).toBeUndefined();
      expect(result.errorMessage).toContain('No active contract');
      expect(result.warnings.some((w) => w.type === 'MISSING_CONTRACT')).toBe(true);
    });

    it('detects missing attendance and missing checkout warnings', () => {
      const detector = new WarningDetector();
      const contract: Contract = {
        id: 'contract-001',
        employee_id: sampleEmployeeA.id,
        salary_structure_id: standardSalaryStructure.id,
        schedule_id: null,
        wage: 44000,
        start_date: '2025-01-01',
        end_date: null,
        status: 'ACTIVE',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const warnings = detector.detect(
        sampleEmployeeA,
        contract,
        '2026-09-01',
        '2026-09-30',
        0, // 0 worked days
        2, // 2 missing checkouts
        41200
      );

      expect(warnings.some((w) => w.type === 'MISSING_ATTENDANCE')).toBe(true);
      expect(warnings.some((w) => w.type === 'MISSING_CHECKOUT')).toBe(true);
    });

    it('detects negative net salary warning', () => {
      const detector = new WarningDetector();
      const contract: Contract = {
        id: 'contract-001',
        employee_id: sampleEmployeeA.id,
        salary_structure_id: standardSalaryStructure.id,
        schedule_id: null,
        wage: 44000,
        start_date: '2025-01-01',
        end_date: null,
        status: 'ACTIVE',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const warnings = detector.detect(
        sampleEmployeeA,
        contract,
        '2026-09-01',
        '2026-09-30',
        22,
        0,
        -500 // Negative net salary
      );

      expect(warnings.some((w) => w.message.includes('negative'))).toBe(true);
    });
  });

  // =========================================================================
  // 7. Multiple Employees & Payrun Summary Computation
  // =========================================================================
  describe('7. Multiple Employees Payrun Batch Computation', () => {
    it('computes batch with multiple employees and aggregates totals', async () => {
      const engine = new PayrollEngine();

      const contractA: Contract = {
        id: 'c-1',
        employee_id: sampleEmployeeA.id,
        salary_structure_id: standardSalaryStructure.id,
        schedule_id: null,
        wage: 45000,
        start_date: '2025-01-01',
        end_date: null,
        status: 'ACTIVE',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      const contractB: Contract = {
        id: 'c-2',
        employee_id: sampleEmployeeB.id,
        salary_structure_id: standardSalaryStructure.id,
        schedule_id: null,
        wage: 45000,
        start_date: '2025-01-01',
        end_date: null,
        status: 'ACTIVE',
        created_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      };

      vi.spyOn(engine['contractResolver'], 'resolve')
        .mockResolvedValueOnce(contractA)
        .mockResolvedValueOnce(contractB);

      vi.spyOn(engine['attendanceCalc'], 'calculate').mockResolvedValue({
        actualWorkedDays: 22,
        actualWorkedHours: 176,
        missingCheckouts: 0
      });

      vi.spyOn(engine['leaveCalc'], 'calculate').mockResolvedValue({
        approvedPaidLeaveDays: 0,
        approvedUnpaidLeaveDays: 0
      });

      const summary = await engine.computePayrun(
        'payrun-batch-1',
        [sampleEmployeeA, sampleEmployeeB],
        standardSalaryStructure,
        '2026-09-01',
        '2026-09-30'
      );

      expect(summary.totalEmployees).toBe(2);
      expect(summary.totalGross).toBe(90000); // 45k + 45k
      expect(summary.totalDeductions).toBe(7600); // 3.8k + 3.8k
      expect(summary.totalNet).toBe(82400); // 41.2k + 41.2k
      expect(summary.results.length).toBe(2);
      expect(summary.results.every((r) => r.success)).toBe(true);
    });
  });

  // =========================================================================
  // 8. Recomputation Idempotency & Clean Persistence
  // =========================================================================
  describe('8. Recomputation Idempotency', () => {
    it('cleans up old payslips and warnings on recompute without duplicating items', async () => {
      const repo = new PayrollRepository();

      const deletePayslipsMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
      const deleteWarningsMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
      const insertPayslipMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'ps-1' }, error: null })
        })
      });
      const insertItemsMock = vi.fn().mockResolvedValue({ data: null, error: null });
      const updatePayrunMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
      const updateEmpMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }) });

      const mockClient: any = {
        from: (table: string) => {
          if (table === 'payslips') {
            return {
              delete: deletePayslipsMock,
              insert: insertPayslipMock
            };
          }
          if (table === 'payroll_warnings') {
            return {
              delete: deleteWarningsMock,
              insert: vi.fn().mockResolvedValue({ data: null, error: null })
            };
          }
          if (table === 'payslip_items') {
            return {
              insert: insertItemsMock
            };
          }
          if (table === 'payrun_employees') {
            return {
              update: updateEmpMock
            };
          }
          if (table === 'payruns') {
            return {
              update: updatePayrunMock
            };
          }
          return {};
        }
      };

      const dummyPayslip = {
        payrunId: 'payrun-recompute-1',
        employeeId: sampleEmployeeA.id,
        contractId: 'contract-1',
        salaryStructureId: 'struct-1',
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        workedDays: 22,
        workedHours: 176,
        grossSalary: 45000,
        totalDeductions: 3800,
        netSalary: 41200,
        status: 'GENERATED' as const,
        items: [
          {
            salary_rule_id: 'rule-01',
            name: 'Basic',
            code: 'BASIC',
            category: 'BASIC',
            sequence: 1,
            amount: 30000,
            calculation_snapshot: {}
          }
        ]
      };

      // 1st Computation
      await repo.saveComputationResults(
        'payrun-recompute-1',
        { totalGross: 45000, totalDeductions: 3800, totalNet: 41200 },
        [dummyPayslip],
        [],
        [{ employeeId: sampleEmployeeA.id, success: true }],
        mockClient
      );

      expect(deletePayslipsMock).toHaveBeenCalledTimes(1);
      expect(deleteWarningsMock).toHaveBeenCalledTimes(1);
      expect(insertPayslipMock).toHaveBeenCalledTimes(1);
      expect(insertItemsMock).toHaveBeenCalledTimes(1);

      // 2nd Computation (Recompute)
      await repo.saveComputationResults(
        'payrun-recompute-1',
        { totalGross: 45000, totalDeductions: 3800, totalNet: 41200 },
        [dummyPayslip],
        [],
        [{ employeeId: sampleEmployeeA.id, success: true }],
        mockClient
      );

      // Deletes called again to ensure clean slate
      expect(deletePayslipsMock).toHaveBeenCalledTimes(2);
      expect(deleteWarningsMock).toHaveBeenCalledTimes(2);
    });
  });
});

import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../../config/supabase.js';
import { ContractResolver } from './ContractResolver.js';
import { WorkingDaysCalculator } from './WorkingDaysCalculator.js';
import { AttendanceCalculator } from './AttendanceCalculator.js';
import { LeaveCalculator } from './LeaveCalculator.js';
import { DeductionCalculator } from './DeductionCalculator.js';
import { SalaryRuleEvaluator } from './SalaryRuleEvaluator.js';
import { WarningDetector, DetectedWarning } from './WarningDetector.js';
import { PayslipBuilder, BuiltPayslip } from './PayslipBuilder.js';
import { Employee } from '../../employees/employees.types.js';
import { SalaryStructure } from '../../salary/salary.types.js';

export interface EmployeePayrollResult {
  employeeId: string;
  success: boolean;
  payslip?: BuiltPayslip;
  warnings: DetectedWarning[];
  errorMessage?: string;
}

export interface PayrunComputationSummary {
  payrunId: string;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  results: EmployeePayrollResult[];
  allWarnings: DetectedWarning[];
}

export class PayrollEngine {
  private contractResolver = new ContractResolver();
  private workingDaysCalc = new WorkingDaysCalculator();
  private attendanceCalc = new AttendanceCalculator();
  private leaveCalc = new LeaveCalculator();
  private deductionCalc = new DeductionCalculator();
  private ruleEvaluator = new SalaryRuleEvaluator();
  private warningDetector = new WarningDetector();
  private payslipBuilder = new PayslipBuilder();

  async computeEmployee(
    payrunId: string,
    employee: Employee,
    structure: SalaryStructure,
    periodStart: string,
    periodEnd: string,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<EmployeePayrollResult> {
    const warnings: DetectedWarning[] = [];

    // 1. Resolve Contract
    const contract = await this.contractResolver.resolve(employee.id, periodStart, periodEnd, client);
    if (!contract) {
      const contractWarnings = this.warningDetector.detect(
        employee,
        null,
        periodStart,
        periodEnd,
        0,
        0,
        0
      );
      return {
        employeeId: employee.id,
        success: false,
        warnings: contractWarnings,
        errorMessage: `No active contract covering period ${periodStart} to ${periodEnd}`
      };
    }

    const fullWage = Number(contract.wage || 0);

    // 2. Working days calculation & Schedule resolution
    const scheduleDays = (contract.schedule as any)?.days?.map((d: any) => d.day_of_week) || [];
    const { workingDays: totalPeriodWorkingDays } = this.workingDaysCalc.calculate(
      periodStart,
      periodEnd,
      scheduleDays
    );

    // 3. Contract Proration (if contract covers partial period)
    const effectiveContractStart = contract.start_date > periodStart ? contract.start_date : periodStart;
    const effectiveContractEnd = contract.end_date && contract.end_date < periodEnd ? contract.end_date : periodEnd;
    const isPartialContract = contract.start_date > periodStart || Boolean(contract.end_date && contract.end_date < periodEnd);

    const { workingDays: contractWorkingDays } = this.workingDaysCalc.calculate(
      effectiveContractStart,
      effectiveContractEnd,
      scheduleDays
    );

    const prorationFactor = totalPeriodWorkingDays > 0
      ? Math.min(1, Math.max(0, contractWorkingDays / totalPeriodWorkingDays))
      : 1;

    const wage = isPartialContract
      ? Number((fullWage * prorationFactor).toFixed(2))
      : fullWage;

    // 4. Attendance calculation
    const { actualWorkedDays, actualWorkedHours, missingCheckouts } = await this.attendanceCalc.calculate(
      employee.id,
      periodStart,
      periodEnd,
      client
    );

    // 5. Leave calculation (overlapping period)
    const { approvedPaidLeaveDays, approvedUnpaidLeaveDays } = await this.leaveCalc.calculate(
      employee.id,
      periodStart,
      periodEnd,
      scheduleDays,
      client
    );

    // 6. Unpaid leave deduction
    const unpaidDeduction = this.deductionCalc.calculateUnpaidLeaveDeduction(
      fullWage,
      totalPeriodWorkingDays,
      approvedUnpaidLeaveDays
    );

    // 7. Base Context
    const effectiveWorkedDays = actualWorkedDays > 0
      ? actualWorkedDays
      : Math.max(0, contractWorkingDays - approvedUnpaidLeaveDays);

    const baseContext: Record<string, number> = {
      WAGE: wage,
      FULL_WAGE: fullWage,
      PRORATION_FACTOR: prorationFactor,
      CONTRACT_DAYS: contractWorkingDays,
      EXPECTED_DAYS: totalPeriodWorkingDays,
      WORKED_DAYS: effectiveWorkedDays,
      PAID_LEAVE_DAYS: approvedPaidLeaveDays,
      UNPAID_DAYS: approvedUnpaidLeaveDays,
      UNPAID_DEDUCTION: unpaidDeduction
    };

    // 8. Evaluate Rules in Structure Sequence
    let rulesToEvaluate = (structure.rules || [])
      .filter((r) => Boolean(r && r.rule))
      .map((r) => ({
        rule: r.rule,
        sequence: r.sequence ?? 0
      }))
      .sort((a, b) => a.sequence - b.sequence);

    if (rulesToEvaluate.length === 0) {
      const { data: dbRules } = await client
        .from('salary_rules')
        .select('*');
      if (dbRules && dbRules.length > 0) {
        const orderMap: Record<string, number> = {
          BASIC: 1,
          HRA: 2,
          TRANSPORT: 3,
          GROSS: 4,
          PF: 5,
          PROFESSIONAL_TAX: 6,
          NET: 7
        };
        rulesToEvaluate = dbRules
          .map((rule) => ({
            rule,
            sequence: orderMap[rule.code] || 99
          }))
          .sort((a, b) => a.sequence - b.sequence);
      }
    }

    let { evaluatedRules, gross, deductions, net } = this.ruleEvaluator.evaluateSequence(
      rulesToEvaluate,
      baseContext
    );

    // 9. Unpaid Leave Line Item Injection if not already represented in rules
    if (unpaidDeduction > 0) {
      const alreadyHandledInRules = evaluatedRules.some(
        (r) => r.rule.code === 'UNPAID_LEAVE' || r.rule.code === 'UNPAID_DEDUCTION'
      );
      if (!alreadyHandledInRules) {
        const maxSeq = evaluatedRules.length > 0
          ? Math.max(...evaluatedRules.map((r) => r.sequence))
          : 0;

        evaluatedRules.push({
          rule: {
            id: '',
            name: 'Unpaid Leave Deduction',
            code: 'UNPAID_LEAVE',
            category: 'DEDUCTION',
            calculation_type: 'FIXED',
            fixed_amount: unpaidDeduction,
            percentage: null,
            formula: null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          sequence: maxSeq + 1,
          amount: unpaidDeduction,
          calculationSnapshot: {
            type: 'UNPAID_LEAVE_DEDUCTION',
            unpaidDays: approvedUnpaidLeaveDays,
            totalPeriodWorkingDays,
            fullWage,
            deductionAmount: unpaidDeduction
          }
        });

        deductions = Number((deductions + unpaidDeduction).toFixed(2));
        net = Number((gross - deductions).toFixed(2));
      }
    }

    // 10. Warning Detection
    const detectedWarnings = this.warningDetector.detect(
      employee,
      contract,
      periodStart,
      periodEnd,
      actualWorkedDays,
      missingCheckouts,
      net
    );
    warnings.push(...detectedWarnings);

    // 11. Build Payslip Record
    const payslip = this.payslipBuilder.build(
      payrunId,
      employee.id,
      contract.id,
      structure.id,
      periodStart,
      periodEnd,
      effectiveWorkedDays,
      actualWorkedHours,
      gross,
      deductions,
      net,
      evaluatedRules
    );

    return {
      employeeId: employee.id,
      success: true,
      payslip,
      warnings
    };
  }

  async computePayrun(
    payrunId: string,
    employees: Employee[],
    structure: SalaryStructure,
    periodStart: string,
    periodEnd: string,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<PayrunComputationSummary> {
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    const results: EmployeePayrollResult[] = [];
    const allWarnings: DetectedWarning[] = [];

    for (const emp of employees) {
      const res = await this.computeEmployee(payrunId, emp, structure, periodStart, periodEnd, client);
      results.push(res);
      allWarnings.push(...res.warnings);

      if (res.success && res.payslip) {
        totalGross += res.payslip.grossSalary;
        totalDeductions += res.payslip.totalDeductions;
        totalNet += res.payslip.netSalary;
      }
    }

    return {
      payrunId,
      totalEmployees: employees.length,
      totalGross: Number(totalGross.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      totalNet: Number(totalNet.toFixed(2)),
      results,
      allWarnings
    };
  }
}


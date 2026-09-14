import { SupabaseClient } from '@supabase/supabase-js';
import { payrollRepository, PayrollRepository } from './payroll.repository.js';
import { PayrollEngine } from './engine/PayrollEngine.js';
import { CreatePayrunDto, PayrunQueryDto, EligibleEmployeesQueryDto, Payrun } from './payroll.types.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { Employee } from '../employees/employees.types.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';

export class PayrollService {
  private engine = new PayrollEngine();

  constructor(private readonly repo: PayrollRepository = payrollRepository) {}

  async getPayruns(query: PayrunQueryDto, client?: SupabaseClient) {
    return this.repo.findAll(query, client);
  }

  async getPayrunById(id: string, client?: SupabaseClient): Promise<Payrun> {
    const payrun = await this.repo.findById(id, client);
    if (!payrun) {
      throw new NotFoundError(`Payrun with ID '${id}' not found`);
    }
    return payrun;
  }

  async getEligibleEmployees(query: EligibleEmployeesQueryDto, client?: SupabaseClient) {
    return this.repo.findEligibleEmployees(
      query.salary_structure_id,
      query.period_start,
      query.period_end,
      client
    );
  }

  async getPayrunEmployees(payrunId: string, client?: SupabaseClient) {
    return this.repo.findPayrunEmployees(payrunId, client);
  }

  async createPayrun(dto: CreatePayrunDto, userId?: string, client?: SupabaseClient): Promise<Payrun> {
    const created = await this.repo.create(dto, userId, client);
    await auditLogsService.log({
      userId,
      action: 'PAYRUN_CREATED',
      entityType: 'payruns',
      entityId: created.id,
      newValues: { name: created.name, periodStart: created.period_start, periodEnd: created.period_end, status: created.status }
    }, client);
    return created;
  }

  async computePayrun(payrunId: string, client?: SupabaseClient): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId, client);

    // State transition check
    if (payrun.status !== 'DRAFT' && payrun.status !== 'COMPUTED') {
      throw new BadRequestError(`Cannot compute payrun in '${payrun.status}' state. Only DRAFT batches can be computed.`);
    }

    if (!payrun.salary_structure) {
      throw new BadRequestError('Payrun is missing an associated salary structure');
    }

    const payrunEmployees = await this.repo.findPayrunEmployees(payrunId, client);
    if (payrunEmployees.length === 0) {
      throw new BadRequestError('No employees assigned to this payrun batch');
    }

    const employeesToCompute: Employee[] = payrunEmployees
      .map((pe) => pe.employee as unknown as Employee)
      .filter(Boolean);

    // Mark payrun employees as PROCESSING
    await this.repo.updatePayrunEmployeeStatus(payrunId, 'PROCESSING', client);

    // Execute Payroll Engine
    const computationSummary = await this.engine.computePayrun(
      payrun.id,
      employeesToCompute,
      payrun.salary_structure,
      payrun.period_start,
      payrun.period_end,
      client
    );

    const validPayslips = computationSummary.results
      .filter((r) => r.success && r.payslip)
      .map((r) => r.payslip!);

    // Persist computation snapshot & employee statuses
    await this.repo.saveComputationResults(
      payrun.id,
      {
        totalGross: computationSummary.totalGross,
        totalDeductions: computationSummary.totalDeductions,
        totalNet: computationSummary.totalNet
      },
      validPayslips,
      computationSummary.allWarnings,
      computationSummary.results.map((r) => ({
        employeeId: r.employeeId,
        success: r.success,
        errorMessage: r.errorMessage
      })),
      client
    );

    await auditLogsService.log({
      action: 'PAYRUN_COMPUTED',
      entityType: 'payruns',
      entityId: payrunId,
      newValues: {
        totalGross: computationSummary.totalGross,
        totalNet: computationSummary.totalNet,
        totalEmployees: computationSummary.totalEmployees,
        status: 'COMPUTED'
      }
    }, client);

    return this.getPayrunById(payrunId, client);
  }

  async validatePayrun(payrunId: string, client?: SupabaseClient): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId, client);

    if (payrun.status !== 'COMPUTED') {
      throw new BadRequestError(`Cannot validate payrun in '${payrun.status}' state. Batch must be COMPUTED first.`);
    }

    const updated = await this.repo.updateStatus(payrunId, 'VALIDATED', {
      validated_at: new Date().toISOString()
    }, client);

    await auditLogsService.log({
      action: 'PAYRUN_VALIDATED',
      entityType: 'payruns',
      entityId: payrunId,
      oldValues: { status: payrun.status },
      newValues: { status: 'VALIDATED', validatedAt: new Date().toISOString() }
    }, client);

    return updated;
  }

  async markPaid(payrunId: string, client?: SupabaseClient): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId, client);

    if (payrun.status !== 'VALIDATED') {
      throw new BadRequestError(`Cannot mark payrun as paid in '${payrun.status}' state. Batch must be VALIDATED first.`);
    }

    const updated = await this.repo.updateStatus(payrunId, 'PAID', {
      paid_at: new Date().toISOString()
    }, client);

    await auditLogsService.log({
      action: 'PAYRUN_PAID',
      entityType: 'payruns',
      entityId: payrunId,
      oldValues: { status: payrun.status },
      newValues: { status: 'PAID', paidAt: new Date().toISOString(), totalNet: payrun.total_net }
    }, client);

    return updated;
  }

  async cancelPayrun(payrunId: string, client?: SupabaseClient): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId, client);

    if (payrun.status !== 'DRAFT' && payrun.status !== 'COMPUTED') {
      throw new BadRequestError(`Cannot cancel payrun in '${payrun.status}' state. Finalized or paid batches cannot be cancelled.`);
    }

    const updated = await this.repo.updateStatus(payrunId, 'CANCELLED', {}, client);

    await auditLogsService.log({
      action: 'PAYRUN_CANCELLED',
      entityType: 'payruns',
      entityId: payrunId,
      oldValues: { status: payrun.status },
      newValues: { status: 'CANCELLED' }
    }, client);

    return updated;
  }

  async getWarnings(payrunId: string, client?: SupabaseClient) {
    await this.getPayrunById(payrunId, client);
    return this.repo.findWarnings(payrunId, client);
  }

  async addEmployeesToPayrun(payrunId: string, employeeIds: string[], client?: SupabaseClient): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId, client);
    if (payrun.status !== 'DRAFT' && payrun.status !== 'COMPUTED') {
      throw new BadRequestError(`Cannot modify employees on a payrun in '${payrun.status}' status. Only DRAFT or COMPUTED batches can be modified.`);
    }
    await this.repo.addEmployeesToPayrun(payrunId, employeeIds, client);
    return this.getPayrunById(payrunId, client);
  }

  async removeEmployeeFromPayrun(payrunId: string, employeeId: string, client?: SupabaseClient): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId, client);
    if (payrun.status !== 'DRAFT' && payrun.status !== 'COMPUTED') {
      throw new BadRequestError(`Cannot modify employees on a payrun in '${payrun.status}' status. Only DRAFT or COMPUTED batches can be modified.`);
    }
    await this.repo.removeEmployeeFromPayrun(payrunId, employeeId, client);
    return this.getPayrunById(payrunId, client);
  }

  async syncAllActiveEmployees(payrunId: string, companyId: string, client?: SupabaseClient): Promise<Payrun> {
    const payrun = await this.getPayrunById(payrunId, client);
    if (payrun.status !== 'DRAFT' && payrun.status !== 'COMPUTED') {
      throw new BadRequestError(`Cannot modify employees on a payrun in '${payrun.status}' status. Only DRAFT or COMPUTED batches can be modified.`);
    }
    await this.repo.syncAllActiveEmployees(payrunId, companyId, client);
    return this.getPayrunById(payrunId, client);
  }
}

export const payrollService = new PayrollService();

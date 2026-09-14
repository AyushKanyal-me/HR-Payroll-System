import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../config/supabase.js';
import { Payrun, PayrunEmployee, PayrollWarning, CreatePayrunDto, PayrunQueryDto } from './payroll.types.js';
import { BuiltPayslip } from './engine/PayslipBuilder.js';
import { DetectedWarning } from './engine/WarningDetector.js';
import { DatabaseError, NotFoundError } from '../../utils/errors.js';

export class PayrollRepository {
  async findAll(
    query: PayrunQueryDto,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<{ data: Payrun[]; total: number }> {
    let queryBuilder = client
      .from('payruns')
      .select(`
        *,
        salary_structure:salary_structures (id, name, code)
      `, { count: 'exact' });

    if (query.company_id) {
      queryBuilder = queryBuilder.eq('company_id', query.company_id);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    if (query.period_start) {
      queryBuilder = queryBuilder.gte('period_start', query.period_start);
    }

    if (query.period_end) {
      queryBuilder = queryBuilder.lte('period_end', query.period_end);
    }

    const offset = (query.page - 1) * query.limit;
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + query.limit - 1);

    const { data, count, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch payruns: ${error.message}`, [error]);
    }

    return {
      data: (data || []) as Payrun[],
      total: count || 0
    };
  }

  async findById(id: string, client: SupabaseClient = supabaseAdminClient): Promise<Payrun | null> {
    const { data, error } = await client
      .from('payruns')
      .select(`
        *,
        salary_structure:salary_structures (
          *,
          rules:salary_structure_rules (
            id, sequence, rule:salary_rules (*)
          )
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch payrun: ${error.message}`, [error]);
    }

    return data as Payrun | null;
  }

  async findPayrunEmployees(payrunId: string, client: SupabaseClient = supabaseAdminClient): Promise<PayrunEmployee[]> {
    const { data, error } = await client
      .from('payrun_employees')
      .select(`
        *,
        employee:employees (
          id, first_name, last_name, work_email, bank_account_number, company_id, schedule_id
        )
      `)
      .eq('payrun_id', payrunId);

    if (error) {
      throw new DatabaseError(`Failed to fetch payrun employees: ${error.message}`, [error]);
    }

    return (data || []) as PayrunEmployee[];
  }

  async findEligibleEmployees(
    structureId: string,
    periodStart: string,
    periodEnd: string,
    client: SupabaseClient = supabaseAdminClient
  ) {
    const { data, error } = await client
      .from('contracts')
      .select(`
        employee:employees (
          id, first_name, last_name, work_email, department_id, job_position_id, status, company_id
        )
      `)
      .eq('salary_structure_id', structureId)
      .eq('status', 'ACTIVE')
      .lte('start_date', periodEnd)
      .or(`end_date.is.null,end_date.gte.${periodStart}`);

    if (error) {
      throw new DatabaseError(`Failed to fetch eligible employees: ${error.message}`, [error]);
    }

    const uniqueEmployees = new Map<string, any>();
    for (const item of (data || []) as any[]) {
      const empData = Array.isArray(item.employee) ? item.employee[0] : item.employee;
      if (empData && empData.status === 'ACTIVE') {
        uniqueEmployees.set(empData.id, empData);
      }
    }

    return Array.from(uniqueEmployees.values());
  }

  async create(dto: CreatePayrunDto, createdByUserId?: string, client: SupabaseClient = supabaseAdminClient): Promise<Payrun> {
    const { employee_ids, ...payrunData } = dto;

    // Validate if createdByUserId exists in the users table to satisfy payruns_created_by_fkey
    let validUserId: string | null = null;
    if (createdByUserId) {
      try {
        const { data: userRecord } = await client
          .from('users')
          .select('id')
          .eq('id', createdByUserId)
          .maybeSingle();
        if (userRecord?.id) {
          validUserId = userRecord.id;
        }
      } catch {
        validUserId = null;
      }
    }

    const companyId = (payrunData as any).company_id || 'a0000000-0000-0000-0000-000000000001';

    let targetEmployeeIds = employee_ids;
    if (!targetEmployeeIds || targetEmployeeIds.length === 0) {
      const { data: activeEmps } = await client
        .from('employees')
        .select('id')
        .eq('company_id', companyId)
        .eq('status', 'ACTIVE');
      if (activeEmps && activeEmps.length > 0) {
        targetEmployeeIds = activeEmps.map((e) => e.id);
      }
    }

    const { data: payrun, error: payrunError } = await client
      .from('payruns')
      .insert({
        ...payrunData,
        company_id: companyId,
        created_by: validUserId,
        status: 'DRAFT',
        total_employees: targetEmployeeIds ? targetEmployeeIds.length : 0
      })
      .select()
      .single();

    if (payrunError) {
      throw new DatabaseError(`Failed to create payrun batch: ${payrunError.message}`, [payrunError]);
    }

    if (targetEmployeeIds && targetEmployeeIds.length > 0) {
      const inserts = targetEmployeeIds.map((empId) => ({
        payrun_id: payrun.id,
        employee_id: empId,
        status: 'SELECTED'
      }));

      const { error: empError } = await client
        .from('payrun_employees')
        .upsert(inserts, { onConflict: 'payrun_id,employee_id' });

      if (empError) {
        throw new DatabaseError(`Failed to attach employees to payrun: ${empError.message}`, [empError]);
      }
    }

    return (await this.findById(payrun.id, client))!;
  }

  async addEmployeesToPayrun(
    payrunId: string,
    employeeIds: string[],
    client: SupabaseClient = supabaseAdminClient
  ): Promise<void> {
    if (!employeeIds || employeeIds.length === 0) return;

    const inserts = employeeIds.map((empId) => ({
      payrun_id: payrunId,
      employee_id: empId,
      status: 'SELECTED'
    }));

    const { error } = await client
      .from('payrun_employees')
      .upsert(inserts, { onConflict: 'payrun_id,employee_id' });

    if (error) {
      throw new DatabaseError(`Failed to add employees to payrun: ${error.message}`, [error]);
    }

    // Refresh total_employees count
    const { count } = await client
      .from('payrun_employees')
      .select('*', { count: 'exact', head: true })
      .eq('payrun_id', payrunId);

    await client
      .from('payruns')
      .update({ total_employees: count || 0 })
      .eq('id', payrunId);
  }

  async removeEmployeeFromPayrun(
    payrunId: string,
    employeeId: string,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<void> {
    const { error } = await client
      .from('payrun_employees')
      .delete()
      .eq('payrun_id', payrunId)
      .eq('employee_id', employeeId);

    if (error) {
      throw new DatabaseError(`Failed to remove employee from payrun: ${error.message}`, [error]);
    }

    const { count } = await client
      .from('payrun_employees')
      .select('*', { count: 'exact', head: true })
      .eq('payrun_id', payrunId);

    await client
      .from('payruns')
      .update({ total_employees: count || 0 })
      .eq('id', payrunId);
  }

  async syncAllActiveEmployees(
    payrunId: string,
    companyId: string,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<number> {
    const { data: activeEmps, error: empErr } = await client
      .from('employees')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'ACTIVE');

    if (empErr) {
      throw new DatabaseError(`Failed to fetch active employees: ${empErr.message}`, [empErr]);
    }

    if (!activeEmps || activeEmps.length === 0) {
      return 0;
    }

    const inserts = activeEmps.map((e) => ({
      payrun_id: payrunId,
      employee_id: e.id,
      status: 'SELECTED'
    }));

    const { error: upsertErr } = await client
      .from('payrun_employees')
      .upsert(inserts, { onConflict: 'payrun_id,employee_id' });

    if (upsertErr) {
      throw new DatabaseError(`Failed to sync employees to payrun: ${upsertErr.message}`, [upsertErr]);
    }

    const { count } = await client
      .from('payrun_employees')
      .select('*', { count: 'exact', head: true })
      .eq('payrun_id', payrunId);

    await client
      .from('payruns')
      .update({ total_employees: count || 0 })
      .eq('id', payrunId);

    return count || 0;
  }

  async updatePayrunEmployeeStatus(
    payrunId: string,
    status: 'SELECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
    client: SupabaseClient = supabaseAdminClient
  ): Promise<void> {
    await client
      .from('payrun_employees')
      .update({ status })
      .eq('payrun_id', payrunId);
  }

  async saveComputationResults(
    payrunId: string,
    totals: { totalGross: number; totalDeductions: number; totalNet: number },
    payslips: BuiltPayslip[],
    warnings: DetectedWarning[],
    employeeResults: { employeeId: string; success: boolean; errorMessage?: string }[] = [],
    client: SupabaseClient = supabaseAdminClient
  ): Promise<void> {
    // 1. Clean up existing payslips & warnings for this payrun (allows clean recomputation)
    await client.from('payslips').delete().eq('payrun_id', payrunId);
    await client.from('payroll_warnings').delete().eq('payrun_id', payrunId);

    // 2. Insert Payslips & line items
    for (const ps of payslips) {
      const { data: insertedPayslip, error: psError } = await client
        .from('payslips')
        .insert({
          payrun_id: ps.payrunId,
          employee_id: ps.employeeId,
          contract_id: ps.contractId,
          salary_structure_id: ps.salaryStructureId,
          period_start: ps.periodStart,
          period_end: ps.periodEnd,
          worked_days: ps.workedDays,
          worked_hours: ps.workedHours,
          gross_salary: ps.grossSalary,
          total_deductions: ps.totalDeductions,
          net_salary: ps.netSalary,
          status: 'GENERATED',
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (psError) {
        throw new DatabaseError(`Failed to save payslip: ${psError.message}`, [psError]);
      }

      if (ps.items && ps.items.length > 0) {
        const lineItems = ps.items.map((item) => ({
          payslip_id: insertedPayslip.id,
          salary_rule_id: item.salary_rule_id || null,
          name: item.name,
          code: item.code,
          category: item.category,
          sequence: item.sequence,
          amount: item.amount,
          calculation_snapshot: item.calculation_snapshot
        }));

        const { error: itemError } = await client
          .from('payslip_items')
          .insert(lineItems);

        if (itemError) {
          throw new DatabaseError(`Failed to save payslip line items: ${itemError.message}`, [itemError]);
        }
      }
    }

    // 3. Insert Warnings
    if (warnings.length > 0) {
      const warningInserts = warnings.map((w) => ({
        payrun_id: payrunId,
        employee_id: w.employeeId ?? null,
        type: w.type,
        severity: w.severity,
        message: w.message
      }));

      await client.from('payroll_warnings').insert(warningInserts);
    }

    // 4. Update Payrun Employee Statuses (COMPLETED or FAILED)
    for (const res of employeeResults) {
      await client
        .from('payrun_employees')
        .update({
          status: res.success ? 'COMPLETED' : 'FAILED',
          error_message: res.errorMessage ?? null
        })
        .eq('payrun_id', payrunId)
        .eq('employee_id', res.employeeId);
    }

    // 5. Update Payrun Status to COMPUTED
    const { error: updateError } = await client
      .from('payruns')
      .update({
        status: 'COMPUTED',
        total_gross: totals.totalGross,
        total_deductions: totals.totalDeductions,
        total_net: totals.totalNet,
        computed_at: new Date().toISOString()
      })
      .eq('id', payrunId);

    if (updateError) {
      throw new DatabaseError(`Failed to update payrun totals: ${updateError.message}`, [updateError]);
    }
  }


  async updateStatus(
    payrunId: string,
    status: 'VALIDATED' | 'PAID' | 'CANCELLED',
    extraFields: Record<string, unknown> = {},
    client: SupabaseClient = supabaseAdminClient
  ): Promise<Payrun> {
    const { error } = await client
      .from('payruns')
      .update({
        status,
        ...extraFields
      })
      .eq('id', payrunId);

    if (error) {
      throw new DatabaseError(`Failed to update payrun status: ${error.message}`, [error]);
    }

    const updated = await this.findById(payrunId, client);
    if (!updated) {
      throw new NotFoundError(`Payrun with ID '${payrunId}' not found`);
    }
    return updated;
  }

  async findWarnings(payrunId: string, client: SupabaseClient = supabaseAdminClient): Promise<PayrollWarning[]> {
    const { data, error } = await client
      .from('payroll_warnings')
      .select('*')
      .eq('payrun_id', payrunId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch payroll warnings: ${error.message}`, [error]);
    }

    return (data || []) as PayrollWarning[];
  }
}

export const payrollRepository = new PayrollRepository();

import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../config/supabase.js';
import {
  Employee,
  EmployeeSmartCounts,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto
} from './employees.types.js';
import { DatabaseError, ConflictError } from '../../utils/errors.js';

export class EmployeesRepository {
  async findAll(
    query: EmployeeQueryDto,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<{ data: Employee[]; total: number }> {
    let queryBuilder = client
      .from('employees')
      .select(`
        *,
        department:departments!employees_department_id_fkey (id, name, code),
        job_position:job_positions (id, title, code),
        manager:employees!manager_id (id, first_name, last_name, work_email),
        schedule:working_schedules (id, name, hours_per_week)
      `, { count: 'exact' });

    if (query.company_id) {
      queryBuilder = queryBuilder.eq('company_id', query.company_id);
    }

    if (query.department_id) {
      queryBuilder = queryBuilder.eq('department_id', query.department_id);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    if (query.search) {
      queryBuilder = queryBuilder.or(
        `first_name.ilike.%${query.search}%,last_name.ilike.%${query.search}%,work_email.ilike.%${query.search}%`
      );
    }

    const offset = (query.page - 1) * query.limit;
    queryBuilder = queryBuilder
      .order('first_name', { ascending: true })
      .range(offset, offset + query.limit - 1);

    const { data, count, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch employees: ${error.message}`, [error]);
    }

    return {
      data: (data || []) as Employee[],
      total: count || 0
    };
  }

  async findById(id: string, client: SupabaseClient = supabaseAdminClient): Promise<Employee | null> {
    const { data, error } = await client
      .from('employees')
      .select(`
        *,
        department:departments!employees_department_id_fkey (id, name, code),
        job_position:job_positions (id, title, code),
        manager:employees!manager_id (id, first_name, last_name, work_email),
        schedule:working_schedules (id, name, hours_per_week)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch employee: ${error.message}`, [error]);
    }

    return data as Employee | null;
  }

  async create(dto: CreateEmployeeDto, client: SupabaseClient = supabaseAdminClient): Promise<Employee> {
    const { employment_type, ...rest } = dto as any;
    const resolvedEmployeeType = dto.employee_type || employment_type || 'FULL_TIME';
    const payload = {
      ...rest,
      company_id: (dto as any).company_id || 'a0000000-0000-0000-0000-000000000001',
      employee_type: resolvedEmployeeType,
      employee_code: (dto as any).employee_code || `EMP-${Math.floor(100000 + Math.random() * 900000)}`
    };

    const { data, error } = await client
      .from('employees')
      .insert(payload)
      .select(`
        *,
        department:departments!employees_department_id_fkey (id, name, code),
        job_position:job_positions (id, title, code),
        manager:employees!manager_id (id, first_name, last_name, work_email),
        schedule:working_schedules (id, name, hours_per_week)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError(`Employee with work email '${dto.work_email}' already exists`);
      }
      throw new DatabaseError(`Failed to create employee: ${error.message}`, [error]);
    }

    return data as Employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, client: SupabaseClient = supabaseAdminClient): Promise<Employee | null> {
    const { employment_type, ...rest } = dto as any;
    const resolvedEmployeeType = dto.employee_type || employment_type;
    const payload = {
      ...rest,
      ...(resolvedEmployeeType ? { employee_type: resolvedEmployeeType } : {})
    };

    const { data, error } = await client
      .from('employees')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        department:departments!employees_department_id_fkey (id, name, code),
        job_position:job_positions (id, title, code),
        manager:employees!manager_id (id, first_name, last_name, work_email),
        schedule:working_schedules (id, name, hours_per_week)
      `)
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError(`Update conflict: ${error.message}`);
      }
      throw new DatabaseError(`Failed to update employee: ${error.message}`, [error]);
    }

    return data as Employee | null;
  }

  async delete(id: string, client: SupabaseClient = supabaseAdminClient): Promise<boolean> {
    const { error } = await client
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete employee: ${error.message}`, [error]);
    }

    return true;
  }

  async getSmartCounts(employeeId: string, client: SupabaseClient = supabaseAdminClient): Promise<EmployeeSmartCounts> {
    const [contractsRes, attendanceRes, timeOffRes, payslipsRes] = await Promise.all([
      client.from('contracts').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
      client.from('attendance').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
      client.from('time_off_requests').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId),
      client.from('payslips').select('id', { count: 'exact', head: true }).eq('employee_id', employeeId)
    ]);

    return {
      employee_id: employeeId,
      contracts_count: contractsRes.count || 0,
      attendance_count: attendanceRes.count || 0,
      time_off_requests_count: timeOffRes.count || 0,
      payslips_count: payslipsRes.count || 0
    };
  }
}

export const employeesRepository = new EmployeesRepository();

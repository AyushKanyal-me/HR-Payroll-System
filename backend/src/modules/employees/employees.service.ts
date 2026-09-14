import { SupabaseClient } from '@supabase/supabase-js';
import { employeesRepository, EmployeesRepository } from './employees.repository.js';
import { supabaseAdminClient } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import {
  Employee,
  EmployeeSmartCounts,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto
} from './employees.types.js';
import { NotFoundError, BadRequestError, DatabaseError } from '../../utils/errors.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';

export interface InviteEmployeeDto {
  role?: 'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER' | 'ADMIN';
  redirect_to?: string;
}

export class EmployeesService {
  constructor(private readonly repo: EmployeesRepository = employeesRepository) {}

  async getEmployees(query: EmployeeQueryDto, client?: SupabaseClient) {
    return this.repo.findAll(query, client);
  }

  async getEmployeeById(id: string, client?: SupabaseClient): Promise<Employee> {
    const employee = await this.repo.findById(id, client);
    if (!employee) {
      throw new NotFoundError(`Employee with ID '${id}' not found`);
    }
    return employee;
  }

  async createEmployee(dto: CreateEmployeeDto, client?: SupabaseClient): Promise<Employee> {
    const created = await this.repo.create(dto, client);
    await auditLogsService.log({
      action: 'EMPLOYEE_CREATED',
      entityType: 'employees',
      entityId: created.id,
      newValues: {
        first_name: created.first_name,
        last_name: created.last_name,
        work_email: created.work_email,
        company_id: created.company_id,
        employment_type: created.employment_type
      }
    }, client);
    return created;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto, client?: SupabaseClient): Promise<Employee> {
    const existing = await this.getEmployeeById(id, client);
    const employee = await this.repo.update(id, dto, client);
    if (!employee) {
      throw new NotFoundError(`Employee with ID '${id}' not found to update`);
    }
    await auditLogsService.log({
      action: 'EMPLOYEE_UPDATED',
      entityType: 'employees',
      entityId: employee.id,
      oldValues: {
        first_name: existing.first_name,
        last_name: existing.last_name,
        work_email: existing.work_email,
        status: existing.status
      },
      newValues: dto
    }, client);
    return employee;
  }

  async deleteEmployee(id: string, client?: SupabaseClient): Promise<boolean> {
    const existing = await this.getEmployeeById(id, client);
    const result = await this.repo.delete(id, client);
    await auditLogsService.log({
      action: 'EMPLOYEE_DELETED',
      entityType: 'employees',
      entityId: id,
      oldValues: {
        first_name: existing.first_name,
        last_name: existing.last_name,
        work_email: existing.work_email,
        company_id: existing.company_id
      }
    }, client);
    return result;
  }

  async getSmartCounts(id: string, client?: SupabaseClient): Promise<EmployeeSmartCounts> {
    await this.getEmployeeById(id, client);
    return this.repo.getSmartCounts(id, client);
  }

  async inviteEmployee(id: string, dto: InviteEmployeeDto = {}, client?: SupabaseClient) {
    const employee = await this.getEmployeeById(id, client);

    if (!employee.work_email) {
      throw new BadRequestError('Employee does not have a configured work email');
    }

    const redirectUrl = dto.redirect_to || `${env.FRONTEND_URL}/setup-account`;
    const assignedRole = dto.role || 'EMPLOYEE';

    let authUserId: string | null = null;
    let actionLink: string | null = null;

    // 1. Trigger Supabase Invite / Magic Link via Admin client
    const { data: inviteData, error: inviteError } = await supabaseAdminClient.auth.admin.inviteUserByEmail(
      employee.work_email,
      {
        redirectTo: redirectUrl,
        data: {
          first_name: employee.first_name,
          last_name: employee.last_name,
          employee_id: employee.id
        }
      }
    );

    if (inviteError) {
      // User already exists in auth. Trigger a password reset / verification email
      await supabaseAdminClient.auth.resetPasswordForEmail(employee.work_email, {
        redirectTo: redirectUrl
      });

      // Also generate direct action link for immediate backup access
      const { data: linkData, error: linkError } = await supabaseAdminClient.auth.admin.generateLink({
        type: 'invite',
        email: employee.work_email,
        options: {
          redirectTo: redirectUrl
        }
      });

      if (linkError) {
        const { data: recoveryData } = await supabaseAdminClient.auth.admin.generateLink({
          type: 'recovery',
          email: employee.work_email,
          options: {
            redirectTo: redirectUrl
          }
        });
        authUserId = recoveryData?.user?.id ?? null;
        actionLink = recoveryData?.properties?.action_link ?? null;
      } else {
        authUserId = linkData?.user?.id ?? null;
        actionLink = linkData?.properties?.action_link ?? null;
      }
    } else {
      authUserId = inviteData?.user?.id ?? null;
      // If inviteData has properties
      actionLink = (inviteData as any)?.properties?.action_link ?? null;
    }

    if (authUserId) {
      // 2. Ensure record in public.users table linking auth_user_id to employee_id
      const { data: existingUser } = await supabaseAdminClient
        .from('users')
        .select('id, auth_user_id, employee_id')
        .or(`auth_user_id.eq.${authUserId},employee_id.eq.${employee.id}`)
        .maybeSingle();

      let targetUserId = existingUser?.id;

      if (!targetUserId) {
        const { data: newUser, error: createError } = await supabaseAdminClient
          .from('users')
          .insert({
            auth_user_id: authUserId,
            employee_id: employee.id,
            is_active: true
          })
          .select('id')
          .single();

        if (createError) {
          throw new DatabaseError(`Failed to create application user profile: ${createError.message}`);
        }
        targetUserId = newUser.id;
      } else {
        await supabaseAdminClient
          .from('users')
          .update({
            auth_user_id: authUserId,
            employee_id: employee.id,
            is_active: true
          })
          .eq('id', targetUserId);
      }

      // 3. Assign designated role in public.user_roles
      const { data: roleRecord } = await supabaseAdminClient
        .from('roles')
        .select('id')
        .eq('name', assignedRole)
        .maybeSingle();

      if (roleRecord && targetUserId) {
        await supabaseAdminClient
          .from('user_roles')
          .upsert(
            { user_id: targetUserId, role_id: roleRecord.id },
            { onConflict: 'user_id,role_id' }
          );
      }
    }

    await auditLogsService.log({
      action: 'EMPLOYEE_INVITED',
      entityType: 'employees',
      entityId: employee.id,
      newValues: { email: employee.work_email, role: assignedRole, authUserId }
    }, client);

    return {
      message: `Invitation email sent successfully to ${employee.work_email}`,
      email: employee.work_email,
      auth_user_id: authUserId,
      role: assignedRole,
      action_link: actionLink
    };
  }
}

export const employeesService = new EmployeesService();


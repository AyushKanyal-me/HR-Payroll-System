import { supabaseAdminClient } from '../../config/supabase.js';
import { AuthenticatedUser, CanonicalRole, LinkedEmployee } from '../../types/auth.js';
import { DatabaseError } from '../../utils/errors.js';

export class AuthRepository {
  async getUserByAuthId(authUserId: string): Promise<AuthenticatedUser | null> {
    let { data: userRecord, error: userError } = await supabaseAdminClient
      .from('users')
      .select(`
        id,
        auth_user_id,
        employee_id,
        is_active,
        employees (
          id,
          company_id,
          first_name,
          last_name,
          work_email,
          status,
          department_id,
          job_position_id
        )
      `)
      .eq('auth_user_id', authUserId)
      .eq('is_active', true)
      .maybeSingle();

    if (userError) {
      throw new DatabaseError(`Failed to fetch user by auth ID: ${userError.message}`, [userError]);
    }

    // Auto-link if not yet created in public.users
    if (!userRecord) {
      const { data: authUserData } = await supabaseAdminClient.auth.admin.getUserById(authUserId);
      if (authUserData?.user?.email) {
        const email = authUserData.user.email;
        const { data: empRecord } = await supabaseAdminClient
          .from('employees')
          .select('id, company_id, first_name, last_name, work_email, status, department_id, job_position_id')
          .eq('work_email', email)
          .maybeSingle();

        const { data: newUser } = await supabaseAdminClient
          .from('users')
          .insert({
            auth_user_id: authUserId,
            employee_id: empRecord?.id ?? null,
            is_active: true
          })
          .select(`
            id,
            auth_user_id,
            employee_id,
            is_active,
            employees (
              id,
              company_id,
              first_name,
              last_name,
              work_email,
              status,
              department_id,
              job_position_id
            )
          `)
          .single();

        if (newUser) {
          userRecord = newUser;
          const { data: roleRecord } = await supabaseAdminClient
            .from('roles')
            .select('id')
            .eq('name', 'EMPLOYEE')
            .maybeSingle();

          if (roleRecord) {
            await supabaseAdminClient
              .from('user_roles')
              .upsert({ user_id: newUser.id, role_id: roleRecord.id }, { onConflict: 'user_id,role_id' });
          }
        }
      }
    }

    if (!userRecord) {
      return null;
    }

    const { data: userRoles, error: rolesError } = await supabaseAdminClient
      .from('user_roles')
      .select(`
        roles (
          name
        )
      `)
      .eq('user_id', userRecord.id);

    if (rolesError) {
      throw new DatabaseError(`Failed to fetch user roles: ${rolesError.message}`, [rolesError]);
    }

    let roles: CanonicalRole[] = (userRoles || [])
      .map((ur: any) => ur.roles?.name as CanonicalRole)
      .filter(Boolean);

    if (roles.length === 0) {
      roles = ['EMPLOYEE'];
    }

    const empData: any = Array.isArray(userRecord.employees)
      ? userRecord.employees[0]
      : userRecord.employees;

    const employee: LinkedEmployee | null = empData
      ? {
        id: empData.id,
        companyId: empData.company_id,
        firstName: empData.first_name,
        lastName: empData.last_name,
        workEmail: empData.work_email,
        status: empData.status,
        departmentId: empData.department_id,
        jobPositionId: empData.job_position_id
      }
      : null;

    return {
      id: userRecord.id,
      authUserId: userRecord.auth_user_id,
      email: employee?.workEmail || '',
      firstName: employee?.firstName || '',
      lastName: employee?.lastName || '',
      employeeId: userRecord.employee_id,
      companyId: employee?.companyId ?? null,
      roles,
      isActive: userRecord.is_active,
      employee
    };
  }
}

export const authRepository = new AuthRepository();

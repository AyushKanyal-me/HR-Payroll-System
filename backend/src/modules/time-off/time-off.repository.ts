import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../config/supabase.js';
import {
  TimeOffType,
  TimeOffAllocation,
  TimeOffRequest,
  CreateTimeOffTypeDto,
  CreateTimeOffAllocationDto,
  TimeOffRequestQueryDto,
  AllocationQueryDto
} from './time-off.types.js';
import { DatabaseError, ConflictError, BadRequestError } from '../../utils/errors.js';

export class TimeOffRepository {
  // Types
  async findAllTypes(client: SupabaseClient = supabaseAdminClient): Promise<TimeOffType[]> {
    const { data, error } = await client
      .from('time_off_types')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to fetch time-off types: ${error.message}`, [error]);
    }

    return (data || []) as TimeOffType[];
  }

  async findTypeById(id: string, client: SupabaseClient = supabaseAdminClient): Promise<TimeOffType | null> {
    const { data, error } = await client
      .from('time_off_types')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch time-off type: ${error.message}`, [error]);
    }

    return data as TimeOffType | null;
  }

  async createType(dto: CreateTimeOffTypeDto, client: SupabaseClient = supabaseAdminClient): Promise<TimeOffType> {
    const { data, error } = await client
      .from('time_off_types')
      .insert(dto)
      .select()
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create time-off type: ${error.message}`, [error]);
    }

    return data as TimeOffType;
  }

  // Allocations
  async findAllAllocations(query: AllocationQueryDto, client: SupabaseClient = supabaseAdminClient): Promise<TimeOffAllocation[]> {
    let queryBuilder = client
      .from('time_off_allocations')
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email, company_id),
        time_off_type:time_off_types (id, name, code, unit)
      `)
      .order('year', { ascending: false });

    if (query.employee_id) {
      queryBuilder = queryBuilder.eq('employee_id', query.employee_id);
    }

    if (query.time_off_type_id) {
      queryBuilder = queryBuilder.eq('time_off_type_id', query.time_off_type_id);
    }

    if (query.year) {
      queryBuilder = queryBuilder.eq('year', query.year);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch leave allocations: ${error.message}`, [error]);
    }

    return (data || []) as TimeOffAllocation[];
  }

  async findAllocationByEmployeeAndType(
    employeeId: string,
    typeId: string,
    year: number,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<TimeOffAllocation | null> {
    const { data, error } = await client
      .from('time_off_allocations')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('time_off_type_id', typeId)
      .eq('year', year)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to find allocation: ${error.message}`, [error]);
    }

    return data as TimeOffAllocation | null;
  }

  async createAllocation(dto: CreateTimeOffAllocationDto, client: SupabaseClient = supabaseAdminClient): Promise<TimeOffAllocation> {
    const { data, error } = await client
      .from('time_off_allocations')
      .insert(dto)
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email, company_id),
        time_off_type:time_off_types (id, name, code, unit)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError('An active allocation for this employee, leave type, and year already exists');
      }
      throw new DatabaseError(`Failed to create leave allocation: ${error.message}`, [error]);
    }

    return data as TimeOffAllocation;
  }

  // Requests
  async findAllRequests(
    query: TimeOffRequestQueryDto,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<{ data: TimeOffRequest[]; total: number }> {
    let queryBuilder = client
      .from('time_off_requests')
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email, company_id),
        time_off_type:time_off_types (id, name, code, unit),
        approver:users!time_off_requests_approved_by_fkey (id, first_name, last_name, email)
      `, { count: 'exact' });

    if (query.employee_id) {
      queryBuilder = queryBuilder.eq('employee_id', query.employee_id);
    }

    if (query.time_off_type_id) {
      queryBuilder = queryBuilder.eq('time_off_type_id', query.time_off_type_id);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    const offset = (query.page - 1) * query.limit;
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + query.limit - 1);

    const { data, count, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch leave requests: ${error.message}`, [error]);
    }

    return {
      data: (data || []) as TimeOffRequest[],
      total: count || 0
    };
  }

  async findRequestById(id: string, client: SupabaseClient = supabaseAdminClient): Promise<TimeOffRequest | null> {
    const { data, error } = await client
      .from('time_off_requests')
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email, company_id),
        time_off_type:time_off_types (id, name, code, unit),
        approver:users!time_off_requests_approved_by_fkey (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch leave request: ${error.message}`, [error]);
    }

    return data as TimeOffRequest | null;
  }

  async createRequest(dto: any, client: SupabaseClient = supabaseAdminClient): Promise<TimeOffRequest> {
    const { data, error } = await client
      .from('time_off_requests')
      .insert(dto)
      .select(`
        *,
        employee:employees (id, first_name, last_name, work_email, company_id),
        time_off_type:time_off_types (id, name, code, unit)
      `)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create time-off request: ${error.message}`, [error]);
    }

    return data as TimeOffRequest;
  }

  // Database Function Callers (Transactional)
  async approveRequestWithDbFunction(requestId: string, approverUserId: string, client: SupabaseClient = supabaseAdminClient): Promise<TimeOffRequest> {
    let validApproverId: string | null = null;
    if (approverUserId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(approverUserId);
      if (isUuid) {
        const { data: userExists } = await supabaseAdminClient
          .from('users')
          .select('id')
          .eq('id', approverUserId)
          .maybeSingle();
        if (userExists?.id) {
          validApproverId = userExists.id;
        }
      }
    }

    const { error } = await client.rpc('approve_time_off_request', {
      p_request_id: requestId,
      p_approver_id: validApproverId
    });

    if (error) {
      if (error.message.includes('insufficient') || error.message.includes('balance') || error.message.includes('used_amount')) {
        throw new BadRequestError(`Approval failed: Insufficient leave balance on allocation.`);
      }
      if (error.message.includes('PENDING')) {
        throw new BadRequestError(`Cannot approve: Request is not in PENDING state.`);
      }
      throw new DatabaseError(`Failed to approve request via transactional database procedure: ${error.message}`, [error]);
    }

    const updated = await this.findRequestById(requestId, client);
    return updated!;
  }

  async refuseRequestWithDbFunction(requestId: string, refuserId: string, reason: string, client: SupabaseClient = supabaseAdminClient): Promise<TimeOffRequest> {
    let validRefuserId: string | null = null;
    if (refuserId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(refuserId);
      if (isUuid) {
        const { data: userExists } = await supabaseAdminClient
          .from('users')
          .select('id')
          .eq('id', refuserId)
          .maybeSingle();
        if (userExists?.id) {
          validRefuserId = userExists.id;
        }
      }
    }

    const { error } = await client.rpc('refuse_time_off_request', {
      p_request_id: requestId,
      p_refuser_id: validRefuserId,
      p_rejection_reason: reason
    });

    if (error) {
      if (error.message.includes('PENDING')) {
        throw new BadRequestError(`Cannot refuse: Request is not in PENDING state.`);
      }
      if (error.message.includes('foreign key') || error.message.includes('violates')) {
        const { error: directErr } = await supabaseAdminClient
          .from('time_off_requests')
          .update({
            status: 'REFUSED',
            rejection_reason: reason,
            approved_by: validRefuserId,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);
        if (directErr) {
          throw new DatabaseError(`Failed to refuse request: ${directErr.message}`, [directErr]);
        }
      } else {
        throw new DatabaseError(`Failed to refuse request via database procedure: ${error.message}`, [error]);
      }
    }

    const updated = await this.findRequestById(requestId, client);
    return updated!;
  }

  async cancelRequestWithDbFunction(requestId: string, cancellerId: string, client: SupabaseClient = supabaseAdminClient): Promise<TimeOffRequest> {
    const { error } = await client.rpc('cancel_time_off_request', {
      p_request_id: requestId,
      p_canceller_id: cancellerId
    });

    if (error) {
      throw new DatabaseError(`Failed to cancel request via database procedure: ${error.message}`, [error]);
    }

    const updated = await this.findRequestById(requestId, client);
    return updated!;
  }
}

export const timeOffRepository = new TimeOffRepository();

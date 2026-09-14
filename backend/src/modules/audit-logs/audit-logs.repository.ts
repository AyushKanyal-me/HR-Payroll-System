import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../config/supabase.js';
import { AuditLogsQueryDto } from './audit-logs.schema.js';
import { AuditLogEntry } from './audit-logs.types.js';
import { DatabaseError } from '../../utils/errors.js';

export class AuditLogsRepository {
  async findAll(
    query: AuditLogsQueryDto,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<{ data: AuditLogEntry[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let builder = client
      .from('audit_logs')
      .select(`
        *,
        user:users (
          id,
          auth_user_id,
          employee_id,
          employee:employees (
            id,
            first_name,
            last_name,
            employee_code,
            company_id
          )
        )
      `, { count: 'exact' });

    if (query.userId) {
      builder = builder.eq('user_id', query.userId);
    }

    if (query.action) {
      builder = builder.ilike('action', `%${query.action}%`);
    }

    const tableOrEntityType = query.table || query.entityType;
    if (tableOrEntityType) {
      builder = builder.eq('entity_type', tableOrEntityType);
    }

    if (query.entityId) {
      builder = builder.eq('entity_id', query.entityId);
    }

    if (query.startDate) {
      builder = builder.gte('created_at', query.startDate);
    }

    if (query.endDate) {
      // If only date is provided without time, include full end of day
      const endTimestamp = query.endDate.includes('T') ? query.endDate : `${query.endDate}T23:59:59.999Z`;
      builder = builder.lte('created_at', endTimestamp);
    }

    builder = builder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await builder;

    if (error) {
      throw new DatabaseError(`Failed to fetch audit logs: ${error.message}`);
    }

    return {
      data: (data || []) as AuditLogEntry[],
      total: count || 0
    };
  }

  async record(
    entry: {
      userId?: string | null;
      action: string;
      entityType: string;
      entityId?: string | null;
      oldValues?: Record<string, any> | null;
      newValues?: Record<string, any> | null;
    },
    client: SupabaseClient = supabaseAdminClient
  ): Promise<AuditLogEntry | null> {
    try {
      const { data, error } = await client
        .from('audit_logs')
        .insert({
          user_id: entry.userId || null,
          action: entry.action,
          entity_type: entry.entityType,
          entity_id: entry.entityId || null,
          old_values: entry.oldValues || null,
          new_values: entry.newValues || null
        })
        .select()
        .single();

      if (error) {
        console.warn('Failed to record audit log:', error.message);
        return null;
      }
      return data as AuditLogEntry;
    } catch (err: any) {
      console.warn('Audit log write error:', err.message);
      return null;
    }
  }
}

export const auditLogsRepository = new AuditLogsRepository();

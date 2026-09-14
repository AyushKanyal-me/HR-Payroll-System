import { SupabaseClient } from '@supabase/supabase-js';
import { AuditLogsRepository, auditLogsRepository } from './audit-logs.repository.js';
import { AuditLogsQueryDto } from './audit-logs.schema.js';
import { AuditLogEntry } from './audit-logs.types.js';

export class AuditLogsService {
  constructor(private readonly repo: AuditLogsRepository = auditLogsRepository) {}

  async getAuditLogs(query: AuditLogsQueryDto, client?: SupabaseClient): Promise<{ data: AuditLogEntry[]; total: number }> {
    return this.repo.findAll(query, client);
  }

  async log(
    entry: {
      userId?: string | null;
      action: string;
      entityType: string;
      entityId?: string | null;
      oldValues?: Record<string, any> | null;
      newValues?: Record<string, any> | null;
    },
    client?: SupabaseClient
  ): Promise<AuditLogEntry | null> {
    return this.repo.record(entry, client);
  }
}

export const auditLogsService = new AuditLogsService();

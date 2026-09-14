import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdminClient } from '../../config/supabase.js';
import { JobPosition, CreatePositionDto, UpdatePositionDto, PositionQueryDto } from './positions.types.js';
import { DatabaseError } from '../../utils/errors.js';

export class PositionsRepository {
  async findAll(
    query: PositionQueryDto,
    client: SupabaseClient = supabaseAdminClient
  ): Promise<JobPosition[]> {
    let queryBuilder = client
      .from('job_positions')
      .select(`
        *,
        department:departments (id, name, code, company_id)
      `);

    if (query.department_id) {
      queryBuilder = queryBuilder.eq('department_id', query.department_id);
    }

    if (query.search) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query.search}%,code.ilike.%${query.search}%`);
    }

    queryBuilder = queryBuilder.order('title', { ascending: true });

    const { data, error } = await queryBuilder;

    if (error) {
      throw new DatabaseError(`Failed to fetch job positions: ${error.message}`, [error]);
    }

    return (data || []) as JobPosition[];
  }

  async findById(id: string, client: SupabaseClient = supabaseAdminClient): Promise<JobPosition | null> {
    const { data, error } = await client
      .from('job_positions')
      .select(`
        *,
        department:departments (id, name, code, company_id)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to fetch job position: ${error.message}`, [error]);
    }

    return data as JobPosition | null;
  }

  async create(dto: CreatePositionDto, client: SupabaseClient = supabaseAdminClient): Promise<JobPosition> {
    const rawDto = dto as any;
    const resolvedName = rawDto.name || rawDto.title;
    const resolvedTitle = rawDto.title || rawDto.name;
    const payload = {
      ...rawDto,
      name: resolvedName,
      title: resolvedTitle,
      company_id: rawDto.company_id || 'a0000000-0000-0000-0000-000000000001',
    };

    const { data, error } = await client
      .from('job_positions')
      .insert(payload)
      .select(`
        *,
        department:departments (id, name, code, company_id)
      `)
      .single();

    if (error) {
      throw new DatabaseError(`Failed to create job position: ${error.message}`, [error]);
    }

    return data as JobPosition;
  }

  async update(id: string, dto: UpdatePositionDto, client: SupabaseClient = supabaseAdminClient): Promise<JobPosition | null> {
    const rawDto = dto as any;
    const payload = { ...rawDto };
    if (rawDto.title && !rawDto.name) {
      payload.name = rawDto.title;
    } else if (rawDto.name && !rawDto.title) {
      payload.title = rawDto.name;
    }

    const { data, error } = await client
      .from('job_positions')
      .update(payload)
      .eq('id', id)
      .select(`
        *,
        department:departments (id, name, code, company_id)
      `)
      .maybeSingle();

    if (error) {
      throw new DatabaseError(`Failed to update job position: ${error.message}`, [error]);
    }

    return data as JobPosition | null;
  }

  async delete(id: string, client: SupabaseClient = supabaseAdminClient): Promise<boolean> {
    const { error } = await client
      .from('job_positions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError(`Failed to delete job position: ${error.message}`, [error]);
    }

    return true;
  }
}

export const positionsRepository = new PositionsRepository();

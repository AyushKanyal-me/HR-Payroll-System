import { SupabaseClient } from '@supabase/supabase-js';
import { positionsRepository, PositionsRepository } from './positions.repository.js';
import { JobPosition, CreatePositionDto, UpdatePositionDto, PositionQueryDto } from './positions.types.js';
import { NotFoundError } from '../../utils/errors.js';

export class PositionsService {
  constructor(private readonly repo: PositionsRepository = positionsRepository) {}

  async getPositions(query: PositionQueryDto, client?: SupabaseClient): Promise<JobPosition[]> {
    return this.repo.findAll(query, client);
  }

  async getPositionById(id: string, client?: SupabaseClient): Promise<JobPosition> {
    const position = await this.repo.findById(id, client);
    if (!position) {
      throw new NotFoundError(`Job position with ID '${id}' not found`);
    }
    return position;
  }

  async createPosition(dto: CreatePositionDto, client?: SupabaseClient): Promise<JobPosition> {
    return this.repo.create(dto, client);
  }

  async updatePosition(id: string, dto: UpdatePositionDto, client?: SupabaseClient): Promise<JobPosition> {
    const position = await this.repo.update(id, dto, client);
    if (!position) {
      throw new NotFoundError(`Job position with ID '${id}' not found to update`);
    }
    return position;
  }

  async deletePosition(id: string, client?: SupabaseClient): Promise<boolean> {
    await this.getPositionById(id, client);
    return this.repo.delete(id, client);
  }
}

export const positionsService = new PositionsService();

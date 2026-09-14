import { SupabaseClient } from '@supabase/supabase-js';
import { schedulesRepository, SchedulesRepository } from './schedules.repository.js';
import {
  WorkingSchedule,
  CreateScheduleDto,
  UpdateScheduleDto,
  ScheduleQueryDto
} from './schedules.types.js';
import { NotFoundError } from '../../utils/errors.js';

export class SchedulesService {
  constructor(private readonly repo: SchedulesRepository = schedulesRepository) {}

  async getSchedules(query: ScheduleQueryDto, client?: SupabaseClient): Promise<WorkingSchedule[]> {
    return this.repo.findAll(query, client);
  }

  async getScheduleById(id: string, client?: SupabaseClient): Promise<WorkingSchedule> {
    const schedule = await this.repo.findById(id, client);
    if (!schedule) {
      throw new NotFoundError(`Working schedule with ID '${id}' not found`);
    }
    return schedule;
  }

  async createSchedule(dto: CreateScheduleDto, client?: SupabaseClient): Promise<WorkingSchedule> {
    return this.repo.create(dto, client);
  }

  async updateSchedule(id: string, dto: UpdateScheduleDto, client?: SupabaseClient): Promise<WorkingSchedule> {
    const schedule = await this.repo.update(id, dto, client);
    if (!schedule) {
      throw new NotFoundError(`Working schedule with ID '${id}' not found to update`);
    }
    return schedule;
  }

  async deleteSchedule(id: string, client?: SupabaseClient): Promise<boolean> {
    await this.getScheduleById(id, client);
    return this.repo.delete(id, client);
  }
}

export const schedulesService = new SchedulesService();

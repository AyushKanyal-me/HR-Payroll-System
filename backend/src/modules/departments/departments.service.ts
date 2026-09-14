import { SupabaseClient } from '@supabase/supabase-js';
import { departmentsRepository, DepartmentsRepository } from './departments.repository.js';
import { Department, CreateDepartmentDto, UpdateDepartmentDto, DepartmentQueryDto } from './departments.types.js';
import { NotFoundError } from '../../utils/errors.js';

export class DepartmentsService {
  constructor(private readonly repo: DepartmentsRepository = departmentsRepository) {}

  async getDepartments(query: DepartmentQueryDto, client?: SupabaseClient) {
    return this.repo.findAll(query, client);
  }

  async getDepartmentById(id: string, client?: SupabaseClient): Promise<Department> {
    const dept = await this.repo.findById(id, client);
    if (!dept) {
      throw new NotFoundError(`Department with ID '${id}' not found`);
    }
    return dept;
  }

  async createDepartment(dto: CreateDepartmentDto, client?: SupabaseClient): Promise<Department> {
    return this.repo.create(dto, client);
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto, client?: SupabaseClient): Promise<Department> {
    const dept = await this.repo.update(id, dto, client);
    if (!dept) {
      throw new NotFoundError(`Department with ID '${id}' not found to update`);
    }
    return dept;
  }

  async deleteDepartment(id: string, client?: SupabaseClient): Promise<boolean> {
    await this.getDepartmentById(id, client);
    return this.repo.delete(id, client);
  }
}

export const departmentsService = new DepartmentsService();

import { SupabaseClient } from '@supabase/supabase-js';
import { companiesRepository, CompaniesRepository } from './companies.repository.js';
import { Company, UpdateCompanyDto } from './companies.types.js';
import { NotFoundError } from '../../utils/errors.js';

export class CompaniesService {
  constructor(private readonly repo: CompaniesRepository = companiesRepository) {}

  async getCompanies(client?: SupabaseClient): Promise<Company[]> {
    return this.repo.findAll(client);
  }

  async getCompanyById(id: string, client?: SupabaseClient): Promise<Company> {
    const company = await this.repo.findById(id, client);
    if (!company) {
      throw new NotFoundError(`Company with ID '${id}' not found`);
    }
    return company;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto, client?: SupabaseClient): Promise<Company> {
    const company = await this.repo.update(id, dto, client);
    if (!company) {
      throw new NotFoundError(`Company with ID '${id}' not found to update`);
    }
    return company;
  }
}

export const companiesService = new CompaniesService();

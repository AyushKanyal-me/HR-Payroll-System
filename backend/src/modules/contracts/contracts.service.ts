import { SupabaseClient } from '@supabase/supabase-js';
import { contractsRepository, ContractsRepository } from './contracts.repository.js';
import { Contract, CreateContractDto, UpdateContractDto, ContractQueryDto } from './contracts.types.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';

export class ContractsService {
  constructor(private readonly repo: ContractsRepository = contractsRepository) {}

  async getContracts(query: ContractQueryDto, client?: SupabaseClient) {
    return this.repo.findAll(query, client);
  }

  async getContractById(id: string, client?: SupabaseClient): Promise<Contract> {
    const contract = await this.repo.findById(id, client);
    if (!contract) {
      throw new NotFoundError(`Contract with ID '${id}' not found`);
    }
    return contract;
  }

  async createContract(dto: CreateContractDto, client?: SupabaseClient): Promise<Contract> {
    const created = await this.repo.create(dto, client);
    await auditLogsService.log({
      action: 'CONTRACT_CREATED',
      entityType: 'contracts',
      entityId: created.id,
      newValues: { employee_id: created.employee_id, wage: created.wage, currency: created.currency, status: created.status }
    }, client);
    return created;
  }

  async updateContract(id: string, dto: UpdateContractDto, client?: SupabaseClient): Promise<Contract> {
    const existing = await this.getContractById(id, client);
    const contract = await this.repo.update(id, dto, client);
    if (!contract) {
      throw new NotFoundError(`Contract with ID '${id}' not found to update`);
    }
    await auditLogsService.log({
      action: 'CONTRACT_UPDATED',
      entityType: 'contracts',
      entityId: contract.id,
      oldValues: { wage: existing.wage, status: existing.status, structure_id: existing.salary_structure_id },
      newValues: dto
    }, client);
    return contract;
  }

  async closeContract(id: string, client?: SupabaseClient): Promise<Contract> {
    const existing = await this.getContractById(id, client);
    if (existing.status === 'EXPIRED' || existing.status === 'TERMINATED') {
      throw new BadRequestError(`Contract is already in '${existing.status}' status`);
    }

    const today = new Date().toISOString().split('T')[0]!;
    const closed = await this.repo.close(id, today, client);
    if (!closed) {
      throw new NotFoundError(`Contract with ID '${id}' not found to close`);
    }

    await auditLogsService.log({
      action: 'CONTRACT_CLOSED',
      entityType: 'contracts',
      entityId: closed.id,
      oldValues: { status: existing.status, end_date: existing.end_date },
      newValues: { status: closed.status, end_date: closed.end_date }
    }, client);

    return closed;
  }
}

export const contractsService = new ContractsService();

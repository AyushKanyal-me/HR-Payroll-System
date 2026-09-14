import { SupabaseClient } from '@supabase/supabase-js';
import { timeOffRepository, TimeOffRepository } from './time-off.repository.js';
import {
  TimeOffType,
  TimeOffAllocation,
  TimeOffRequest,
  CreateTimeOffTypeDto,
  CreateTimeOffAllocationDto,
  CreateTimeOffRequestDto,
  TimeOffRequestQueryDto,
  AllocationQueryDto
} from './time-off.types.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../utils/errors.js';
import { auditLogsService } from '../audit-logs/audit-logs.service.js';

export class TimeOffService {
  constructor(private readonly repo: TimeOffRepository = timeOffRepository) {}

  // Types
  async getTypes(client?: SupabaseClient): Promise<TimeOffType[]> {
    return this.repo.findAllTypes(client);
  }

  async createType(dto: CreateTimeOffTypeDto, client?: SupabaseClient): Promise<TimeOffType> {
    return this.repo.createType(dto, client);
  }

  // Allocations
  async getAllocations(query: AllocationQueryDto, client?: SupabaseClient): Promise<TimeOffAllocation[]> {
    return this.repo.findAllAllocations(query, client);
  }

  async createAllocation(dto: CreateTimeOffAllocationDto, client?: SupabaseClient): Promise<TimeOffAllocation> {
    return this.repo.createAllocation(dto, client);
  }

  // Requests
  async getRequests(query: TimeOffRequestQueryDto, client?: SupabaseClient) {
    return this.repo.findAllRequests(query, client);
  }

  async getRequestById(id: string, client?: SupabaseClient): Promise<TimeOffRequest> {
    const req = await this.repo.findRequestById(id, client);
    if (!req) {
      throw new NotFoundError(`Time-off request with ID '${id}' not found`);
    }
    return req;
  }

  async submitRequest(employeeId: string, dto: CreateTimeOffRequestDto, client?: SupabaseClient): Promise<TimeOffRequest> {
    const targetEmployeeId = dto.employee_id || employeeId;
    const leaveType = await this.repo.findTypeById(dto.time_off_type_id, client);

    if (!leaveType) {
      throw new NotFoundError(`Time-off type with ID '${dto.time_off_type_id}' not found`);
    }

    let allocationId = dto.allocation_id || null;

    // Auto-resolve allocation if leave type requires allocation
    if (leaveType.requires_allocation && !allocationId) {
      const year = new Date(dto.start_date).getFullYear();
      let allocation = await this.repo.findAllocationByEmployeeAndType(targetEmployeeId, leaveType.id, year, client);

      if (!allocation) {
        // Auto-provision standard initial leave allocation for new employees
        const typeNameLower = leaveType.name.toLowerCase();
        const defaultDays = typeNameLower.includes('sick') ? 10
          : typeNameLower.includes('casual') ? 12
          : typeNameLower.includes('annual') ? 15
          : 15;

        allocation = await this.repo.createAllocation({
          employee_id: targetEmployeeId,
          time_off_type_id: leaveType.id,
          allocated_amount: defaultDays,
          year: year,
          status: 'ACTIVE'
        }, client);
      }

      const available = Number(allocation.allocated_amount) - Number(allocation.used_amount);
      if (available < dto.duration) {
        throw new BadRequestError(
          `Insufficient leave balance. Available: ${available} ${leaveType.unit}, Requested: ${dto.duration} ${leaveType.unit}`
        );
      }

      allocationId = allocation.id;
    }

    const created = await this.repo.createRequest({
      employee_id: targetEmployeeId,
      time_off_type_id: dto.time_off_type_id,
      allocation_id: allocationId,
      start_date: dto.start_date,
      end_date: dto.end_date,
      duration: dto.duration,
      reason: dto.reason ?? null,
      status: 'PENDING'
    }, client);

    await auditLogsService.log({
      action: 'TIME_OFF_REQUESTED',
      entityType: 'time_off_requests',
      entityId: created.id,
      newValues: { employee_id: targetEmployeeId, duration: dto.duration, start_date: dto.start_date, end_date: dto.end_date }
    }, client);

    return created;
  }

  async approveRequest(id: string, approverUserId: string, client?: SupabaseClient): Promise<TimeOffRequest> {
    const request = await this.getRequestById(id, client);
    if (request.status !== 'PENDING') {
      throw new BadRequestError(`Cannot approve request in status '${request.status}'`);
    }
    const approved = await this.repo.approveRequestWithDbFunction(id, approverUserId, client);
    await auditLogsService.log({
      userId: approverUserId,
      action: 'TIME_OFF_APPROVED',
      entityType: 'time_off_requests',
      entityId: id,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'APPROVED', approver_id: approverUserId }
    }, client);
    return approved;
  }

  async refuseRequest(id: string, refuserId: string, reason: string, client?: SupabaseClient): Promise<TimeOffRequest> {
    const request = await this.getRequestById(id, client);
    if (request.status !== 'PENDING') {
      throw new BadRequestError(`Cannot refuse request in status '${request.status}'`);
    }
    const refused = await this.repo.refuseRequestWithDbFunction(id, refuserId, reason, client);
    await auditLogsService.log({
      userId: refuserId,
      action: 'TIME_OFF_REFUSED',
      entityType: 'time_off_requests',
      entityId: id,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'REFUSED', refuserId, reason }
    }, client);
    return refused;
  }

  async cancelRequest(id: string, cancellerUserId: string, cancellerEmployeeId?: string | null, isManager = false, client?: SupabaseClient): Promise<TimeOffRequest> {
    const request = await this.getRequestById(id, client);

    if (request.status === 'REFUSED' || request.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot cancel request already in '${request.status}' status`);
    }

    if (!isManager && cancellerEmployeeId && request.employee_id !== cancellerEmployeeId) {
      throw new ForbiddenError('You can only cancel your own leave requests');
    }

    const cancelled = await this.repo.cancelRequestWithDbFunction(id, cancellerUserId, client);
    await auditLogsService.log({
      userId: cancellerUserId,
      action: 'TIME_OFF_CANCELLED',
      entityType: 'time_off_requests',
      entityId: id,
      oldValues: { status: request.status },
      newValues: { status: 'CANCELLED', cancellerUserId }
    }, client);
    return cancelled;
  }
}

export const timeOffService = new TimeOffService();

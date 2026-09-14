import { Request, Response, NextFunction } from 'express';
import { timeOffService, TimeOffService } from './time-off.service.js';
import { employeesRepository } from '../employees/employees.repository.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { ForbiddenError, BadRequestError } from '../../utils/errors.js';
import { hasAnyRole, isEmployeeOnly } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class TimeOffController {
  constructor(private readonly service: TimeOffService = timeOffService) {}

  // Types
  getTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;
      const types = await this.service.getTypes(client);
      sendSuccess(res, types);
    } catch (error) {
      next(error);
    }
  };

  createType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;
      const type = await this.service.createType(req.body, client);
      sendCreated(res, type);
    } catch (error) {
      next(error);
    }
  };

  // Allocations
  getAllocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      if (isEmployeeOnly(req.user)) {
        if (!req.user?.employeeId) {
          throw new ForbiddenError('No employee profile linked to user account');
        }
        query.employee_id = req.user.employeeId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const allocations = await this.service.getAllocations(query, client);

      const filtered = !hasAnyRole(req.user, 'ADMIN') && req.user?.companyId
        ? allocations.filter((a: any) => !a.employee?.company_id || a.employee?.company_id === req.user?.companyId)
        : allocations;

      sendSuccess(res, filtered);
    } catch (error) {
      next(error);
    }
  };

  createAllocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: verify target employee belongs to caller company for non-admins
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && req.body.employee_id) {
        const targetEmployee = await employeesRepository.findById(req.body.employee_id, client);
        if (targetEmployee && targetEmployee.company_id && targetEmployee.company_id !== req.user.companyId) {
          throw new ForbiddenError('Access denied. Cannot create allocation for an employee of another company');
        }
      }

      const allocation = await this.service.createAllocation(req.body, client);
      sendCreated(res, allocation);
    } catch (error) {
      next(error);
    }
  };

  // Requests
  getRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      if (isEmployeeOnly(req.user)) {
        if (!req.user?.employeeId) {
          throw new ForbiddenError('No employee profile linked to user account');
        }
        query.employee_id = req.user.employeeId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const { data, total } = await this.service.getRequests(query, client);

      const filtered = !hasAnyRole(req.user, 'ADMIN') && req.user?.companyId
        ? data.filter((r: any) => !r.employee?.company_id || r.employee?.company_id === req.user?.companyId)
        : data;

      sendPaginated(res, filtered, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getRequestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const request = await this.service.getRequestById(targetId, client);

      if (isEmployeeOnly(req.user)) {
        if (request.employee_id !== req.user?.employeeId) {
          throw new ForbiddenError('You can only view your own leave requests');
        }
      }

      const reqEmp = request as any;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && reqEmp.employee?.company_id && reqEmp.employee.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot view leave request from another company');
      }

      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;
      let employeeId = req.user?.employeeId;

      if (isEmployeeOnly(req.user)) {
        if (!employeeId) {
          throw new BadRequestError('User must be linked to an employee profile');
        }
      } else {
        employeeId = req.body.employee_id || employeeId;
        if (!employeeId) {
          throw new BadRequestError('employee_id is required');
        }
      }

      const request = await this.service.submitRequest(employeeId, req.body, client);
      sendCreated(res, request);
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const approverUserId = req.user?.id;
      if (!approverUserId) {
        throw new ForbiddenError('Authenticated user required');
      }

      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: verify request belongs to caller company before approving
      const existing = await this.service.getRequestById(targetId, client);
      const reqEmp = (existing as any).employee;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && reqEmp?.company_id && reqEmp.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot approve leave request from another company');
      }

      const request = await this.service.approveRequest(targetId, approverUserId, client);
      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  refuse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refuserId = req.user?.id;
      if (!refuserId) {
        throw new ForbiddenError('Authenticated user required');
      }

      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: verify request belongs to caller company before refusing
      const existing = await this.service.getRequestById(targetId, client);
      const reqEmp = (existing as any).employee;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && reqEmp?.company_id && reqEmp.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot refuse leave request from another company');
      }

      const request = await this.service.refuseRequest(
        targetId,
        refuserId,
        req.body.rejection_reason,
        client
      );

      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cancellerUserId = req.user?.id;
      if (!cancellerUserId) {
        throw new ForbiddenError('Authenticated user required');
      }

      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: verify request belongs to caller company before cancelling
      const existing = await this.service.getRequestById(targetId, client);
      const reqEmp = (existing as any).employee;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && reqEmp?.company_id && reqEmp.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot cancel leave request from another company');
      }

      const isManager = hasAnyRole(req.user, 'HR_MANAGER', 'ADMIN');
      const request = await this.service.cancelRequest(
        targetId,
        cancellerUserId,
        req.user?.employeeId,
        isManager,
        client
      );

      sendSuccess(res, request);
    } catch (error) {
      next(error);
    }
  };
}

export const timeOffController = new TimeOffController();

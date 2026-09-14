import { Request, Response, NextFunction } from 'express';
import { employeesService, EmployeesService } from './employees.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';
import { hasAnyRole, isEmployeeOnly } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class EmployeesController {
  constructor(private readonly service: EmployeesService = employeesService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      // Force company isolation for non-admins
      if (!hasAnyRole(req.user, 'ADMIN')) {
        if (!req.user?.companyId) {
          throw new ForbiddenError('User has no associated company');
        }
        query.company_id = req.user.companyId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const { data, total } = await this.service.getEmployees(query, client);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const employee = await this.service.getEmployeeById(targetId, client);

      // Verify company isolation for non-admins
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && employee.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot view an employee from another company');
      }

      // Verify self-access for employee-only users
      if (isEmployeeOnly(req.user) && req.user?.employeeId !== targetId) {
        throw new ForbiddenError('Access denied. You can only view your own employee profile');
      }

      sendSuccess(res, employee);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = { ...req.body };

      // Ensure company_id is present
      if (!payload.company_id) {
        payload.company_id = req.user?.companyId || 'a0000000-0000-0000-0000-000000000001';
      }

      // Force authoritative companyId for non-admins
      if (!hasAnyRole(req.user, 'ADMIN')) {
        if (!req.user?.companyId) {
          throw new ForbiddenError('User has no associated company');
        }
        payload.company_id = req.user.companyId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const employee = await this.service.createEmployee(payload, client);
      sendCreated(res, employee);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const payload = { ...req.body };
      // Prevent changing company_id for non-admin
      if (!hasAnyRole(req.user, 'ADMIN')) {
        delete payload.company_id;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: verify employee belongs to caller company before modifying
      const existing = await this.service.getEmployeeById(targetId, client);
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && existing.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot modify an employee from another company');
      }

      const employee = await this.service.updateEmployee(targetId, payload, client);
      sendSuccess(res, employee);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: verify employee belongs to caller company before deleting
      const existing = await this.service.getEmployeeById(targetId, client);
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && existing.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot delete an employee from another company');
      }

      await this.service.deleteEmployee(targetId, client);
      sendSuccess(res, { message: 'Employee record successfully deleted' });
    } catch (error) {
      next(error);
    }
  };

  getSmartCounts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;

      // Verify self-access for employee-only users
      if (isEmployeeOnly(req.user) && req.user?.employeeId !== targetId) {
        throw new ForbiddenError('Access denied. You can only view your own smart counts');
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const counts = await this.service.getSmartCounts(targetId, client);
      sendSuccess(res, counts);
    } catch (error) {
      next(error);
    }
  };

  invite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const payload = { ...req.body };
      const client = req.token ? createScopedClient(req.token) : undefined;

      const employee = await this.service.getEmployeeById(targetId, client);

      // Verify company isolation for non-admins
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && employee.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot invite an employee from another company');
      }

      const result = await this.service.inviteEmployee(targetId, payload, client);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

export const employeesController = new EmployeesController();

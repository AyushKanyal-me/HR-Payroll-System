import { Request, Response, NextFunction } from 'express';
import { departmentsService, DepartmentsService } from './departments.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';
import { hasAnyRole } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class DepartmentsController {
  constructor(private readonly service: DepartmentsService = departmentsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      if (!hasAnyRole(req.user, 'ADMIN')) {
        if (!req.user?.companyId) {
          throw new ForbiddenError('User has no associated company');
        }
        query.company_id = req.user.companyId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const { data, total } = await this.service.getDepartments(query, client);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const dept = await this.service.getDepartmentById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && dept.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot view a department from another company');
      }

      sendSuccess(res, dept);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = { ...req.body };

      if (!payload.company_id) {
        payload.company_id = req.user?.companyId || 'a0000000-0000-0000-0000-000000000001';
      }

      if (!hasAnyRole(req.user, 'ADMIN')) {
        if (!req.user?.companyId) {
          throw new ForbiddenError('User has no associated company');
        }
        payload.company_id = req.user.companyId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const dept = await this.service.createDepartment(payload, client);
      sendCreated(res, dept);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const existing = await this.service.getDepartmentById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && existing.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot modify a department from another company');
      }

      const payload = { ...req.body };
      if (!hasAnyRole(req.user, 'ADMIN')) {
        delete payload.company_id;
      }

      const dept = await this.service.updateDepartment(targetId, payload, client);
      sendSuccess(res, dept);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const existing = await this.service.getDepartmentById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && existing.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot delete a department from another company');
      }

      await this.service.deleteDepartment(targetId, client);
      sendSuccess(res, { message: 'Department successfully deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export const departmentsController = new DepartmentsController();

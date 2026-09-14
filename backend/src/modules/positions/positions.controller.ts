import { Request, Response, NextFunction } from 'express';
import { positionsService, PositionsService } from './positions.service.js';
import { departmentsService } from '../departments/departments.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';
import { hasAnyRole } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class PositionsController {
  constructor(private readonly service: PositionsService = positionsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const positions = await this.service.getPositions(query, client);

      const filtered = !hasAnyRole(req.user, 'ADMIN') && req.user?.companyId
        ? positions.filter((p) => !p.department?.company_id || p.department?.company_id === req.user?.companyId)
        : positions;

      sendSuccess(res, filtered);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const position = await this.service.getPositionById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && position.department?.company_id && position.department.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot view a job position from another company');
      }

      sendSuccess(res, position);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;
      const payload = { ...req.body };

      if (!payload.company_id) {
        payload.company_id = req.user?.companyId || 'a0000000-0000-0000-0000-000000000001';
      }

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payload.department_id) {
        const dept = await departmentsService.getDepartmentById(payload.department_id, client);
        if (dept.company_id !== req.user.companyId) {
          throw new ForbiddenError('Access denied. Cannot create position in another company department');
        }
      }

      const position = await this.service.createPosition(payload, client);
      sendCreated(res, position);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const existing = await this.service.getPositionById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && existing.department?.company_id && existing.department.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot modify a job position from another company');
      }

      const position = await this.service.updatePosition(targetId, req.body, client);
      sendSuccess(res, position);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const existing = await this.service.getPositionById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && existing.department?.company_id && existing.department.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot delete a job position from another company');
      }

      await this.service.deletePosition(targetId, client);
      sendSuccess(res, { message: 'Job position successfully deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export const positionsController = new PositionsController();

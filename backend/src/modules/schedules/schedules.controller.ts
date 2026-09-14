import { Request, Response, NextFunction } from 'express';
import { schedulesService, SchedulesService } from './schedules.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';
import { hasAnyRole } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class SchedulesController {
  constructor(private readonly service: SchedulesService = schedulesService) {}

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
      const schedules = await this.service.getSchedules(query, client);
      sendSuccess(res, schedules);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const schedule = await this.service.getScheduleById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && schedule.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot view a schedule from another company');
      }

      sendSuccess(res, schedule);
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
      const schedule = await this.service.createSchedule(payload, client);
      sendCreated(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const existing = await this.service.getScheduleById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && existing.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot modify a schedule from another company');
      }

      const payload = { ...req.body };
      if (!hasAnyRole(req.user, 'ADMIN')) {
        delete payload.company_id;
      }

      const schedule = await this.service.updateSchedule(targetId, payload, client);
      sendSuccess(res, schedule);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const existing = await this.service.getScheduleById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && existing.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot delete a schedule from another company');
      }

      await this.service.deleteSchedule(targetId, client);
      sendSuccess(res, { message: 'Working schedule successfully deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export const schedulesController = new SchedulesController();

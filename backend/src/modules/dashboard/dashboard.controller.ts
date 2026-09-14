import { Request, Response, NextFunction } from 'express';
import { dashboardService, DashboardService } from './dashboard.service.js';
import { sendSuccess } from '../../utils/response.js';
import { BadRequestError, ForbiddenError } from '../../utils/errors.js';
import { hasAnyRole } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class DashboardController {
  constructor(private readonly service: DashboardService = dashboardService) {}

  private resolveCompanyId(req: Request): string {
    const isSystemAdmin = hasAnyRole(req.user, 'ADMIN');

    if (isSystemAdmin) {
      const targetCompanyId = (req.query.companyId as string) || req.user?.companyId;
      if (!targetCompanyId) {
        throw new BadRequestError('Company ID is required for dashboard analytics');
      }
      return targetCompanyId;
    }

    // For non-admin, authoritative company ID comes strictly from authenticated user context
    if (!req.user?.companyId) {
      throw new ForbiddenError('User has no associated company');
    }

    // Reject attempt to specify another company in query param
    if (req.query.companyId && req.query.companyId !== req.user.companyId) {
      throw new ForbiddenError('Access denied. You cannot view dashboard metrics for another company');
    }

    return req.user.companyId;
  }

  getKpis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = this.resolveCompanyId(req);
      const client = req.token ? createScopedClient(req.token) : undefined;
      const kpis = await this.service.getKpis(companyId, req.query as any, client);
      sendSuccess(res, kpis);
    } catch (error) {
      next(error);
    }
  };

  getSalaryByDept = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = this.resolveCompanyId(req);
      const client = req.token ? createScopedClient(req.token) : undefined;
      const data = await this.service.getSalaryByDepartment(companyId, req.query as any, client);
      sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getSalaryTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = this.resolveCompanyId(req);
      const client = req.token ? createScopedClient(req.token) : undefined;
      const trends = await this.service.getSalaryTrends(companyId, req.query as any, client);
      sendSuccess(res, trends);
    } catch (error) {
      next(error);
    }
  };

  getAttendanceOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = this.resolveCompanyId(req);
      const client = req.token ? createScopedClient(req.token) : undefined;
      const overview = await this.service.getAttendanceOverview(companyId, req.query as any, client);
      sendSuccess(res, overview);
    } catch (error) {
      next(error);
    }
  };

  getOperationalAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companyId = this.resolveCompanyId(req);
      const client = req.token ? createScopedClient(req.token) : undefined;
      const alerts = await this.service.getOperationalAlerts(companyId, client);
      sendSuccess(res, alerts);
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();

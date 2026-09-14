import { Request, Response, NextFunction } from 'express';
import { payrollService, PayrollService } from './payroll.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';
import { hasAnyRole } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class PayrollController {
  constructor(private readonly service: PayrollService = payrollService) {}

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
      const { data, total } = await this.service.getPayruns(query, client);
      sendPaginated(res, data, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const payrun = await this.service.getPayrunById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrun.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot view payrun from another company');
      }

      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  getEligibleEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;
      const employees = await this.service.getEligibleEmployees(req.query as any, client);

      const filtered = !hasAnyRole(req.user, 'ADMIN') && req.user?.companyId
        ? employees.filter((e: any) => !e.company_id || e.company_id === req.user?.companyId)
        : employees;

      sendSuccess(res, filtered);
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
      const payrun = await this.service.createPayrun(payload, req.user?.id, client);
      sendCreated(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  compute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const payrun = await this.service.computePayrun(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrun.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot compute payrun for another company');
      }

      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  validate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const payrun = await this.service.validatePayrun(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrun.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot validate payrun for another company');
      }

      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  markPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const payrun = await this.service.markPaid(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrun.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot mark payrun paid for another company');
      }

      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const payrun = await this.service.cancelPayrun(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrun.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot cancel payrun for another company');
      }

      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  getWarnings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Verify company isolation
      const payrun = await this.service.getPayrunById(targetId, client);
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrun.company_id && payrun.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot view warnings for a payrun of another company');
      }

      const warnings = await this.service.getWarnings(targetId, client);
      sendSuccess(res, warnings);
    } catch (error) {
      next(error);
    }
  };

  getPayrunEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Verify company isolation
      const payrun = await this.service.getPayrunById(targetId, client);
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrun.company_id && payrun.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot view employees for a payrun of another company');
      }

      const employees = await this.service.getPayrunEmployees(targetId, client);
      sendSuccess(res, employees);
    } catch (error) {
      next(error);
    }
  };

  addEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const { employee_ids } = req.body;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Verify payrun company isolation
      const payrun = await this.service.getPayrunById(targetId, client);
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrun.company_id && payrun.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot modify a payrun of another company');
      }

      const updatedPayrun = await this.service.addEmployeesToPayrun(targetId, employee_ids || [], client);
      sendSuccess(res, updatedPayrun);
    } catch (error) {
      next(error);
    }
  };

  syncAllEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const payrunObj = await this.service.getPayrunById(targetId, client);

      // Verify payrun company isolation
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrunObj.company_id && payrunObj.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot sync employees for a payrun of another company');
      }

      const companyId = payrunObj.company_id || req.user?.companyId || 'a0000000-0000-0000-0000-000000000001';
      const payrun = await this.service.syncAllActiveEmployees(targetId, companyId, client);
      sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  };

  removeEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const employeeId = req.params.employeeId as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Verify payrun company isolation
      const payrun = await this.service.getPayrunById(targetId, client);
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrun.company_id && payrun.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot modify a payrun of another company');
      }

      const updatedPayrun = await this.service.removeEmployeeFromPayrun(targetId, employeeId, client);
      sendSuccess(res, updatedPayrun);
    } catch (error) {
      next(error);
    }
  };
}

export const payrollController = new PayrollController();

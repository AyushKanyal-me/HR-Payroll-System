import { Request, Response, NextFunction } from 'express';
import { salaryService, SalaryService } from './salary.service.js';
import { sendSuccess, sendCreated } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';
import { hasAnyRole } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class SalaryController {
  constructor(private readonly service: SalaryService = salaryService) {}

  // Structures
  getAllStructures = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      if (!hasAnyRole(req.user, 'ADMIN')) {
        if (!req.user?.companyId) {
          throw new ForbiddenError('User has no associated company');
        }
        query.company_id = req.user.companyId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const structures = await this.service.getStructures(query, client);
      sendSuccess(res, structures);
    } catch (error) {
      next(error);
    }
  };

  getStructureById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const structure = await this.service.getStructureById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && structure.company_id && structure.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot view salary structure from another company');
      }

      sendSuccess(res, structure);
    } catch (error) {
      next(error);
    }
  };

  createStructure = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = { ...req.body };

      if (!hasAnyRole(req.user, 'ADMIN')) {
        if (!req.user?.companyId) {
          throw new ForbiddenError('User has no associated company');
        }
        payload.company_id = req.user.companyId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const structure = await this.service.createStructure(payload, client);
      sendCreated(res, structure);
    } catch (error) {
      next(error);
    }
  };

  updateStructure = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const existing = await this.service.getStructureById(targetId, client);

      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && existing.company_id && existing.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot modify salary structure from another company');
      }

      const payload = { ...req.body };
      if (!hasAnyRole(req.user, 'ADMIN')) {
        delete payload.company_id;
      }

      const structure = await this.service.updateStructure(targetId, payload, client);
      sendSuccess(res, structure);
    } catch (error) {
      next(error);
    }
  };

  // Rules
  getAllRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;
      const rules = await this.service.getRules(req.query as any, client);
      sendSuccess(res, rules);
    } catch (error) {
      next(error);
    }
  };

  getRuleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;
      const rule = await this.service.getRuleById(req.params.id as string, client);
      sendSuccess(res, rule);
    } catch (error) {
      next(error);
    }
  };

  createRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;
      const rule = await this.service.createRule(req.body, client);
      sendCreated(res, rule);
    } catch (error) {
      next(error);
    }
  };

  updateRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;
      const rule = await this.service.updateRule(req.params.id as string, req.body, client);
      sendSuccess(res, rule);
    } catch (error) {
      next(error);
    }
  };
}

export const salaryController = new SalaryController();

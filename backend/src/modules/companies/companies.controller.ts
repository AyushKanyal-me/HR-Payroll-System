import { Request, Response, NextFunction } from 'express';
import { companiesService, CompaniesService } from './companies.service.js';
import { sendSuccess } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';
import { hasAnyRole } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class CompaniesController {
  constructor(private readonly service: CompaniesService = companiesService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Admin can see all companies
      if (hasAnyRole(req.user, 'ADMIN')) {
        const companies = await this.service.getCompanies(client);
        sendSuccess(res, companies);
        return;
      }

      // Non-admin can only see their own company
      if (req.user?.companyId) {
        const company = await this.service.getCompanyById(req.user.companyId, client);
        sendSuccess(res, [company]);
        return;
      }

      sendSuccess(res, []);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetCompanyId = req.params.id as string;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId !== targetCompanyId) {
        throw new ForbiddenError('Access denied. You cannot view another company details');
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const company = await this.service.getCompanyById(targetCompanyId, client);
      sendSuccess(res, company);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetCompanyId = req.params.id as string;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId !== targetCompanyId) {
        throw new ForbiddenError('Access denied. You cannot modify another company');
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const company = await this.service.updateCompany(targetCompanyId, req.body, client);
      sendSuccess(res, company);
    } catch (error) {
      next(error);
    }
  };
}

export const companiesController = new CompaniesController();

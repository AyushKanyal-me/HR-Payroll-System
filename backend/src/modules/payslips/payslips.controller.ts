import { Request, Response, NextFunction } from 'express';
import { payslipsService, PayslipsService } from './payslips.service.js';
import { payrollRepository } from '../payroll/payroll.repository.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { hasAnyRole, hasPayrollReadAccess, hasPayrollManageAccess } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class PayslipsController {
  constructor(private readonly service: PayslipsService = payslipsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      // If user does not have elevated payroll read access, scope query strictly to their own employee ID
      if (!hasPayrollReadAccess(req.user)) {
        if (!req.user?.employeeId) {
          throw new ForbiddenError('No employee profile linked to user account');
        }
        query.employee_id = req.user.employeeId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const { data, total } = await this.service.getPayslips(query, client);

      const filtered = !hasAnyRole(req.user, 'ADMIN') && req.user?.companyId
        ? data.filter((p: any) => !p.employee?.company_id || p.employee?.company_id === req.user?.companyId)
        : data;

      sendPaginated(res, filtered, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isPrivileged = hasPayrollReadAccess(req.user);
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      const payslip = await this.service.getPayslipById(
        targetId,
        req.user?.employeeId,
        isPrivileged,
        client
      );

      // Verify company isolation for non-admins
      const emp = payslip.employee as any;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && emp?.company_id && emp.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot view payslip from another company');
      }

      sendSuccess(res, payslip);
    } catch (error) {
      next(error);
    }
  };

  downloadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isPrivileged = hasPayrollReadAccess(req.user);
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      const pdfBuffer = await this.service.generatePdf(
        targetId,
        req.user?.employeeId,
        isPrivileged,
        client
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="payslip-${req.params.id}.pdf"`);
      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  sendEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!hasPayrollManageAccess(req.user)) {
        throw new ForbiddenError('Requires payroll management permissions to send payslip email');
      }

      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Verify company isolation
      const payslip = await this.service.getPayslipById(targetId, null, true, client);
      const empComp = (payslip as any).employee?.company_id || (payslip as any).payrun?.company_id;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && empComp && empComp !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot send payslip for an employee of another company');
      }

      const result = await this.service.sendPayslipEmail(targetId, client);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  sendBulk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!hasPayrollManageAccess(req.user)) {
        throw new ForbiddenError('Requires payroll management permissions to send bulk payslip emails');
      }

      const payrunId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Verify payrun tenant isolation
      const payrun = await payrollRepository.findById(payrunId, client);
      if (!payrun) {
        throw new NotFoundError(`Payrun with ID '${payrunId}' not found`);
      }
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && payrun.company_id && payrun.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot send payslips for a payrun of another company');
      }

      const result = await this.service.sendBulkPayrunPayslips(payrunId, client);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };

  getDeliveries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!hasPayrollReadAccess(req.user)) {
        throw new ForbiddenError('Requires payroll access to view delivery logs');
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const { data, total } = await this.service.getDeliveries(req.query as any, client);

      const filtered = !hasAnyRole(req.user, 'ADMIN') && req.user?.companyId
        ? data.filter((d: any) => !d.payslip?.employee?.company_id || d.payslip?.employee?.company_id === req.user?.companyId)
        : data;

      sendPaginated(res, filtered, (req.query as any).page, (req.query as any).limit, total);
    } catch (error) {
      next(error);
    }
  };
}

export const payslipsController = new PayslipsController();

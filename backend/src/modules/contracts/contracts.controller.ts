import { Request, Response, NextFunction } from 'express';
import { contractsService, ContractsService } from './contracts.service.js';
import { employeesService } from '../employees/employees.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { ForbiddenError } from '../../utils/errors.js';
import { hasAnyRole, isEmployeeOnly } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class ContractsController {
  constructor(private readonly service: ContractsService = contractsService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      if (isEmployeeOnly(req.user)) {
        if (!req.user?.employeeId) {
          throw new ForbiddenError('No employee profile linked to your account');
        }
        query.employee_id = req.user.employeeId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const { data, total } = await this.service.getContracts(query, client);

      // Filter by company if user is not admin
      const filteredData = !hasAnyRole(req.user, 'ADMIN') && req.user?.companyId
        ? data.filter((c: any) => !c.employee?.company_id || c.employee?.company_id === req.user?.companyId)
        : data;

      sendPaginated(res, filteredData, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;
      const contract = await this.service.getContractById(targetId, client);

      // Self-access verification for EMPLOYEE role
      if (isEmployeeOnly(req.user)) {
        if (contract.employee_id !== req.user?.employeeId) {
          throw new ForbiddenError('You can only view your own employment contracts');
        }
      }

      // Company isolation for non-admins
      const contractEmp = contract as any;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && contractEmp.employee?.company_id && contractEmp.employee.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. You cannot view a contract from another company');
      }

      sendSuccess(res, contract);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Verify employee belongs to caller company for non-admins
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId) {
        const emp = await employeesService.getEmployeeById(req.body.employee_id, client);
        if (emp.company_id !== req.user.companyId) {
          throw new ForbiddenError('Access denied. Cannot create contract for an employee of another company');
        }
      }

      const contract = await this.service.createContract(req.body, client);
      sendCreated(res, contract);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: verify contract belongs to caller company before update
      const existing = await this.service.getContractById(targetId, client);
      const contractEmp = existing as any;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && contractEmp.employee?.company_id && contractEmp.employee.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot modify contract for an employee of another company');
      }

      const contract = await this.service.updateContract(targetId, req.body, client);
      sendSuccess(res, contract);
    } catch (error) {
      next(error);
    }
  };

  close = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: verify contract belongs to caller company before close
      const existing = await this.service.getContractById(targetId, client);
      const contractEmp = existing as any;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && contractEmp.employee?.company_id && contractEmp.employee.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot close contract for an employee of another company');
      }

      const contract = await this.service.closeContract(targetId, client);
      sendSuccess(res, contract);
    } catch (error) {
      next(error);
    }
  };
}

export const contractsController = new ContractsController();

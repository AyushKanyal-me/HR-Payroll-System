import { Request, Response, NextFunction } from 'express';
import { attendanceService, AttendanceService } from './attendance.service.js';
import { employeesRepository } from '../employees/employees.repository.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../utils/response.js';
import { ForbiddenError, BadRequestError } from '../../utils/errors.js';
import { hasAnyRole, isEmployeeOnly } from '../../utils/permissions.js';
import { createScopedClient } from '../../config/supabase.js';

export class AttendanceController {
  constructor(private readonly service: AttendanceService = attendanceService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = { ...req.query } as any;

      // Scoping for standard EMPLOYEE role
      if (isEmployeeOnly(req.user)) {
        if (!req.user?.employeeId) {
          throw new ForbiddenError('No employee profile linked to your user account');
        }
        query.employee_id = req.user.employeeId;
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const { data, total } = await this.service.getAttendanceRecords(query, client);

      const filteredData = !hasAnyRole(req.user, 'ADMIN') && req.user?.companyId
        ? data.filter((r: any) => !r.employee?.company_id || r.employee?.company_id === req.user?.companyId)
        : data;

      sendPaginated(res, filteredData, query.page, query.limit, total);
    } catch (error) {
      next(error);
    }
  };

  getQuickStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = (req.params.employeeId as string) || req.user?.employeeId;
      if (!employeeId) {
        throw new BadRequestError('Current user is not linked to an employee profile');
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const status = await this.service.getQuickStatus(employeeId, client);
      sendSuccess(res, status);
    } catch (error) {
      next(error);
    }
  };

  checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        throw new BadRequestError('Current user is not linked to an employee profile');
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const record = await this.service.checkIn(employeeId, client);
      sendCreated(res, record);
    } catch (error) {
      next(error);
    }
  };

  checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        throw new BadRequestError('Current user is not linked to an employee profile');
      }

      const client = req.token ? createScopedClient(req.token) : undefined;
      const record = await this.service.checkOut(employeeId, client);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  createManual = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: verify target employee belongs to caller company for non-admins
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && req.body.employee_id) {
        const targetEmployee = await employeesRepository.findById(req.body.employee_id, client);
        if (targetEmployee && targetEmployee.company_id && targetEmployee.company_id !== req.user.companyId) {
          throw new ForbiddenError('Access denied. Cannot create attendance for an employee of another company');
        }
      }

      const record = await this.service.createManualAttendance(req.body, client);
      sendCreated(res, record);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: fetch record and verify tenant ownership before mutation
      const existing = await this.service.getAttendanceById(targetId, client);
      const emp = (existing as any).employee;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && emp?.company_id && emp.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot modify attendance for an employee of another company');
      }

      const record = await this.service.updateAttendance(targetId, req.body, client);
      sendSuccess(res, record);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetId = req.params.id as string;
      const client = req.token ? createScopedClient(req.token) : undefined;

      // Pre-authorize: fetch record and verify tenant ownership before deletion
      const existing = await this.service.getAttendanceById(targetId, client);
      const emp = (existing as any).employee;
      if (!hasAnyRole(req.user, 'ADMIN') && req.user?.companyId && emp?.company_id && emp.company_id !== req.user.companyId) {
        throw new ForbiddenError('Access denied. Cannot delete attendance for an employee of another company');
      }

      await this.service.deleteAttendance(targetId, client);
      sendSuccess(res, { message: 'Attendance record deleted' });
    } catch (error) {
      next(error);
    }
  };
}

export const attendanceController = new AttendanceController();

import { z } from 'zod';

export const employeeStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'TERMINATED']);
export const employeeTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);

const emptyStringToNull = (val: unknown) =>
  typeof val === 'string' && val.trim() === '' ? null : val;

const optionalUuid = z.preprocess(
  emptyStringToNull,
  z.string().uuid('Invalid UUID format').nullable().optional()
    .or(z.string().min(1).transform(() => null)) // gracefully sanitize non-UUID demo IDs to null
);

const optionalEmail = z.preprocess(
  emptyStringToNull,
  z.string().email('Invalid email address format').nullable().optional()
);

const optionalString = z.preprocess(
  emptyStringToNull,
  z.string().nullable().optional()
);

export const createEmployeeSchema = z.object({
  company_id: optionalUuid,
  employee_code: optionalString,
  department_id: optionalUuid,
  job_position_id: optionalUuid,
  manager_id: optionalUuid,
  schedule_id: optionalUuid,
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  work_email: z.string().email('Valid work email is required'),
  personal_email: optionalEmail,
  phone: optionalString,
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'hire_date must be YYYY-MM-DD'),
  employee_type: employeeTypeEnum.default('FULL_TIME'),
  employment_type: employeeTypeEnum.optional(),
  status: employeeStatusEnum.default('ACTIVE'),
  bank_account_number: optionalString,
  bank_name: optionalString,
  bank_ifsc: optionalString,
  pan_number: optionalString,
  aadhaar_number: optionalString
});

export const updateEmployeeSchema = z.object({
  employee_code: optionalString,
  department_id: optionalUuid,
  job_position_id: optionalUuid,
  manager_id: optionalUuid,
  schedule_id: optionalUuid,
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  work_email: z.string().email().optional(),
  personal_email: optionalEmail,
  phone: optionalString,
  hire_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  employee_type: employeeTypeEnum.optional(),
  employment_type: employeeTypeEnum.optional(),
  status: employeeStatusEnum.optional(),
  bank_account_number: optionalString,
  bank_name: optionalString,
  bank_ifsc: optionalString,
  pan_number: optionalString,
  aadhaar_number: optionalString
});

export const employeeIdParamSchema = z.object({
  id: z.string().uuid('Invalid employee ID format')
});

export const employeeQuerySchema = z.object({
  department_id: z.preprocess(emptyStringToNull, z.string().uuid().optional()),
  status: employeeStatusEnum.optional(),
  company_id: z.preprocess(emptyStringToNull, z.string().uuid().optional()),
  search: optionalString,
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const inviteEmployeeSchema = z.object({
  role: z.enum(['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']).default('EMPLOYEE'),
  redirect_to: z.string().optional()
});


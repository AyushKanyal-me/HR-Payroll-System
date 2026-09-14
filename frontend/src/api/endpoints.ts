import { apiClient, BASE_URL } from './client';
import {
  Employee,
  EmployeeSmartCounts,
  Contract,
  AttendanceRecord,
  AttendanceQuickStatus,
  TimeOffRequest,
  TimeOffAllocation,
  TimeOffType,
  Department,
  JobPosition,
  WorkingSchedule,
  SalaryStructure,
  SalaryRule,
  Payrun,
  PayrunEmployee,
  PayrollWarning,
  PayslipDetailed,
  DashboardKpis,
  DepartmentSalaryItem,
  SalaryTrendItem,
  AttendanceOverview,
  OperationalAlerts,
  AuditLogEntry,
  Company,
} from '../types';

// Auth Endpoints
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiClient.post<{ user: any; token: string }>('/auth/login', credentials),
  getMe: () => apiClient.get<any>('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

// Dashboard Endpoints
export const dashboardApi = {
  getKpis: () => apiClient.get<DashboardKpis>('/dashboard/kpis'),
  getSalaryByDept: () => apiClient.get<DepartmentSalaryItem[]>('/dashboard/salary-by-department'),
  getSalaryTrends: (months = 6) => apiClient.get<SalaryTrendItem[]>('/dashboard/salary-trends', { months }),
  getAttendanceOverview: (startDate?: string, endDate?: string) =>
    apiClient.get<AttendanceOverview>('/dashboard/attendance-overview', { startDate, endDate }),
  getAlerts: () => apiClient.get<OperationalAlerts>('/dashboard/alerts'),
};

// Employees Endpoints
export const employeesApi = {
  getAll: (params?: { department_id?: string; status?: string; search?: string; page?: number; limit?: number }) =>
    apiClient.get<Employee[]>('/employees', params),
  getById: (id: string) => apiClient.get<Employee>('/employees/' + id),
  getSmartCounts: (id: string) => apiClient.get<EmployeeSmartCounts>('/employees/' + id + '/smart-counts'),
  create: (data: Partial<Employee>) => apiClient.post<Employee>('/employees', data),
  update: (id: string, data: Partial<Employee>) => apiClient.patch<Employee>('/employees/' + id, data),
  invite: (id: string, data?: { role?: string; redirect_to?: string }) =>
    apiClient.post<{ message: string; email: string; role: string }>('/employees/' + id + '/invite', data || {}),
};

// Contracts Endpoints
export const contractsApi = {
  getAll: (params?: { employee_id?: string; status?: string; search?: string; page?: number; limit?: number }) =>
    apiClient.get<Contract[]>('/contracts', params),
  getById: (id: string) => apiClient.get<Contract>('/contracts/' + id),
  create: (data: Partial<Contract>) => apiClient.post<Contract>('/contracts', data),
  update: (id: string, data: Partial<Contract>) => apiClient.patch<Contract>('/contracts/' + id, data),
  close: (id: string) => apiClient.post('/contracts/' + id + '/close'),
};

// Attendance Endpoints
export const attendanceApi = {
  getAll: (params?: { employee_id?: string; status?: string; start_date?: string; end_date?: string; page?: number; limit?: number }) =>
    apiClient.get<AttendanceRecord[]>('/attendance', params),
  getById: (id: string) => apiClient.get<AttendanceRecord>('/attendance/' + id),
  getQuickStatus: (employeeId: string) =>
    apiClient.get<AttendanceQuickStatus>('/attendance/quick-status/' + employeeId),
  checkIn: (data: { employee_id: string; check_in_time?: string }) =>
    apiClient.post<AttendanceRecord>('/attendance/check-in', data),
  checkOut: (data: { employee_id: string; check_out_time?: string }) =>
    apiClient.post<AttendanceRecord>('/attendance/check-out', data),
  createManual: (data: any) => apiClient.post<AttendanceRecord>('/attendance/manual', data),
  update: (id: string, data: any) => apiClient.patch<AttendanceRecord>('/attendance/' + id, data),
};

// Time Off Endpoints
export const timeOffApi = {
  getRequests: (params?: { employee_id?: string; status?: string; time_off_type_id?: string; start_date?: string; end_date?: string }) =>
    apiClient.get<TimeOffRequest[]>('/time-off/requests', params),
  createRequest: (data: any) => apiClient.post<TimeOffRequest>('/time-off/requests', data),
  approveRequest: (id: string) => apiClient.post<TimeOffRequest>('/time-off/requests/' + id + '/approve'),
  refuseRequest: (id: string, reason: string) =>
    apiClient.post<TimeOffRequest>('/time-off/requests/' + id + '/refuse', { rejection_reason: reason }),
  cancelRequest: (id: string) => apiClient.post<TimeOffRequest>('/time-off/requests/' + id + '/cancel'),
  getAllocations: (params?: { employee_id?: string; year?: number; status?: string }) =>
    apiClient.get<TimeOffAllocation[]>('/time-off/allocations', params),
  createAllocation: (data: any) => apiClient.post<TimeOffAllocation>('/time-off/allocations', data),
  getTypes: () => apiClient.get<TimeOffType[]>('/time-off/types'),
  createType: (data: any) => apiClient.post<TimeOffType>('/time-off/types', data),
};

// Salary Structures & Rules
export const salaryApi = {
  getStructures: (params?: { is_active?: boolean }) =>
    apiClient.get<SalaryStructure[]>('/salary-structures', params),
  getStructureById: (id: string) => apiClient.get<SalaryStructure>('/salary-structures/' + id),
  createStructure: (data: any) => apiClient.post<SalaryStructure>('/salary-structures', data),
  updateStructure: (id: string, data: any) => apiClient.patch<SalaryStructure>('/salary-structures/' + id, data),
  getRules: (params?: { category?: string; is_active?: boolean }) =>
    apiClient.get<SalaryRule[]>('/salary-rules', params),
  getRuleById: (id: string) => apiClient.get<SalaryRule>('/salary-rules/' + id),
  createRule: (data: any) => apiClient.post<SalaryRule>('/salary-rules', data),
  updateRule: (id: string, data: any) => apiClient.patch<SalaryRule>('/salary-rules/' + id, data),
};

// Payroll Endpoints
export const payrollApi = {
  getPayruns: (params?: { status?: string; page?: number; limit?: number }) =>
    apiClient.get<Payrun[]>('/payruns', params),
  getPayrunById: (id: string) => apiClient.get<Payrun>('/payruns/' + id),
  createPayrun: (data: { name: string; period_start: string; period_end: string; salary_structure_id: string; company_id?: string; employee_ids?: string[] }) =>
    apiClient.post<Payrun>('/payruns', data),
  compute: (id: string) => apiClient.post<Payrun>('/payruns/' + id + '/compute'),
  validate: (id: string) => apiClient.post<Payrun>('/payruns/' + id + '/validate'),
  markAsPaid: (id: string) => apiClient.post<Payrun>('/payruns/' + id + '/paid'),
  cancel: (id: string) => apiClient.post<Payrun>('/payruns/' + id + '/cancel'),
  getPayrunEmployees: (payrunId: string) =>
    apiClient.get<PayrunEmployee[]>('/payruns/' + payrunId + '/employees'),
  addEmployees: (payrunId: string, employee_ids: string[]) =>
    apiClient.post<Payrun>('/payruns/' + payrunId + '/employees', { employee_ids }),
  removeEmployee: (payrunId: string, employeeId: string) =>
    apiClient.delete<Payrun>('/payruns/' + payrunId + '/employees/' + employeeId),
  syncAllEmployees: (payrunId: string) =>
    apiClient.post<Payrun>('/payruns/' + payrunId + '/sync-all'),
  getPayrunWarnings: (payrunId: string) =>
    apiClient.get<PayrollWarning[]>('/payruns/' + payrunId + '/warnings'),
  resolveWarning: (warningId: string) =>
    apiClient.post('/payruns/warnings/' + warningId + '/resolve'),
};

// Payslips Endpoints
export const payslipsApi = {
  getAll: (params?: { employee_id?: string; payrun_id?: string; status?: string; period_start?: string; period_end?: string }) =>
    apiClient.get<PayslipDetailed[]>('/payslips', params),
  getById: (id: string) => apiClient.get<PayslipDetailed>('/payslips/' + id),
  getPdfUrl: (id: string) => BASE_URL + '/payslips/' + id + '/pdf',
  deliverBulk: (payrunId: string) =>
    apiClient.post('/payslip-deliveries/bulk', { payrun_id: payrunId }),
};

// Org Entities
export const departmentsApi = {
  getAll: () => apiClient.get<Department[]>('/departments'),
  create: (data: Partial<Department>) => apiClient.post<Department>('/departments', data),
  update: (id: string, data: Partial<Department>) => apiClient.patch<Department>('/departments/' + id, data),
};

export const positionsApi = {
  getAll: (params?: { department_id?: string }) => apiClient.get<JobPosition[]>('/job-positions', params),
  create: (data: Partial<JobPosition>) => apiClient.post<JobPosition>('/job-positions', data),
  update: (id: string, data: Partial<JobPosition>) => apiClient.patch<JobPosition>('/job-positions/' + id, data),
};

export const schedulesApi = {
  getAll: () => apiClient.get<WorkingSchedule[]>('/schedules'),
  getById: (id: string) => apiClient.get<WorkingSchedule>('/schedules/' + id),
  create: (data: any) => apiClient.post<WorkingSchedule>('/schedules', data),
  update: (id: string, data: any) => apiClient.patch<WorkingSchedule>('/schedules/' + id, data),
};

// Companies & Settings
export const companiesApi = {
  getCurrent: (id?: string) => apiClient.get<Company>('/companies/' + (id || 'current')),
  update: (id: string, data: Partial<Company>) => apiClient.patch<Company>('/companies/' + id, data),
};

// Audit Logs
export const auditLogsApi = {
  getAll: (params?: { entity_type?: string; action?: string; user_id?: string; start_date?: string; end_date?: string }) =>
    apiClient.get<AuditLogEntry[]>('/audit-logs', params),
};

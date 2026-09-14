// Common API Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

// Auth Roles
export type CanonicalRole =
  | 'ADMIN'
  | 'HR_MANAGER'
  | 'HR_PAYROLL_MANAGER'
  | 'HR_PAYROLL_USER'
  | 'EMPLOYEE';

export interface AuthenticatedUser {
  id: string;
  authUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  employeeId?: string | null;
  companyId?: string | null;
  roles: CanonicalRole[];
  isActive: boolean;
  employee?: {
    id: string;
    companyId: string;
    firstName: string;
    lastName: string;
    workEmail: string;
    status: string;
    departmentId?: string | null;
    jobPositionId?: string | null;
  } | null;
}

// Company
export interface Company {
  id: string;
  name: string;
  tax_id: string | null;
  registration_number: string | null;
  currency: string;
  fiscal_year_start_month: number | null;
  fiscal_year_end_month: number | null;
  address: string | null;
  country: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

// Department
export interface Department {
  id: string;
  company_id: string;
  name: string;
  code: string;
  parent_department_id: string | null;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
  manager?: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
  } | null;
}

// Job Position
export interface JobPosition {
  id: string;
  department_id: string | null;
  title: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

// Working Schedule
export interface ScheduleDay {
  id?: string;
  schedule_id?: string;
  day_of_week: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  start_time: string;
  end_time: string;
  break_hours: number;
  total_hours: number;
}

export interface WorkingSchedule {
  id: string;
  company_id: string;
  name: string;
  schedule_type: 'FIXED' | 'FLEXIBLE';
  days_per_week: number;
  hours_per_week: number;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  days?: ScheduleDay[];
}

// Employee
export interface Employee {
  id: string;
  company_id: string;
  employee_code?: string;
  department_id: string | null;
  job_position_id: string | null;
  manager_id: string | null;
  schedule_id: string | null;
  first_name: string;
  last_name: string;
  work_email: string;
  personal_email: string | null;
  phone: string | null;
  hire_date: string;
  employee_type?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  employment_type?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED';
  bank_account_number: string | null;
  bank_name: string | null;
  bank_ifsc: string | null;
  pan_number: string | null;
  aadhaar_number: string | null;
  created_at: string;
  updated_at: string;
  department?: { id: string; name: string; code: string } | null;
  job_position?: { id: string; title: string; code: string } | null;
  manager?: { id: string; first_name: string; last_name: string; work_email: string } | null;
  schedule?: { id: string; name: string; hours_per_week: number } | null;
}

export interface EmployeeSmartCounts {
  employee_id: string;
  contracts_count: number;
  attendance_count: number;
  time_off_requests_count: number;
  payslips_count: number;
}

// Contract
export interface Contract {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string | null;
  department_id: string | null;
  job_position_id: string | null;
  schedule_id: string | null;
  salary_structure_id: string | null;
  wage: number;
  currency: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
  } | null;
  department?: { id: string; name: string } | null;
  job_position?: { id: string; title: string } | null;
  schedule?: { id: string; name: string; hours_per_week: number } | null;
  salary_structure?: { id: string; name: string; code: string } | null;
}

export interface PunchSession {
  check_in: string;
  check_out: string | null;
  duration_minutes: number;
  duration_hours: number;
}

// Attendance
export interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  worked_hours: number | null;
  overtime_hours: number;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'OVERTIME' | 'MISSING_CHECKOUT';
  is_manual_edit: boolean;
  correction_note: string | null;
  sessions?: PunchSession[];
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
  } | null;
}

export interface AttendanceQuickStatus {
  employee_id: string;
  attendance_date: string;
  is_checked_in: boolean;
  is_checked_out: boolean;
  check_in: string | null;
  check_out: string | null;
  elapsed_minutes: number;
  worked_hours: number;
  status: string;
  sessions?: PunchSession[];
}

// Time Off
export interface TimeOffType {
  id: string;
  company_id: string;
  name: string;
  code: string;
  unit: 'DAYS' | 'HOURS';
  requires_allocation: boolean;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeOffAllocation {
  id: string;
  employee_id: string;
  time_off_type_id: string;
  year: number;
  allocated_amount: number;
  used_amount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
  employee?: { id: string; first_name: string; last_name: string; work_email: string } | null;
  time_off_type?: { id: string; name: string; code: string; unit: string } | null;
}

export interface TimeOffRequest {
  id: string;
  employee_id: string;
  time_off_type_id: string;
  allocation_id: string | null;
  start_date: string;
  end_date: string;
  duration: number;
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'REFUSED' | 'CANCELLED';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  employee?: { id: string; first_name: string; last_name: string; work_email: string } | null;
  time_off_type?: { id: string; name: string; code: string; unit: string } | null;
  approver?: { id: string; first_name: string; last_name: string; email: string } | null;
}

// Salary Rules & Structures
export interface SalaryRule {
  id: string;
  name: string;
  code: string;
  category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET';
  calculation_type: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  fixed_amount: number | null;
  percentage: number | null;
  formula: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SequencedSalaryRule {
  id: string;
  salary_structure_id: string;
  salary_rule_id: string;
  sequence: number;
  created_at: string;
  rule: SalaryRule;
}

export interface SalaryStructure {
  id: string;
  company_id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rules?: SequencedSalaryRule[];
}

// Payruns
export interface Payrun {
  id: string;
  company_id: string;
  salary_structure_id: string;
  name: string;
  period_start: string;
  period_end: string;
  status: 'DRAFT' | 'COMPUTED' | 'VALIDATED' | 'PAID' | 'CANCELLED';
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  computed_at: string | null;
  validated_at: string | null;
  paid_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  salary_structure?: SalaryStructure | null;
  employees_count?: number;
  warnings_count?: number;
}

export interface PayrunEmployee {
  id: string;
  payrun_id: string;
  employee_id: string;
  status: 'SELECTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
    bank_account_number: string | null;
  };
}

export interface PayrollWarning {
  id: string;
  payrun_id: string;
  payslip_id: string | null;
  employee_id: string | null;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

// Payslips
export interface PayslipItem {
  id: string;
  payslip_id: string;
  salary_rule_id: string | null;
  name: string;
  code: string;
  category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET';
  sequence: number;
  amount: number;
  calculation_snapshot: Record<string, unknown> | null;
}

export interface PayslipDetailed {
  id: string;
  payrun_id: string;
  employee_id: string;
  contract_id: string | null;
  salary_structure_id: string;
  period_start: string;
  period_end: string;
  worked_days: number | null;
  worked_hours: number | null;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  status: 'GENERATED' | 'SENT' | 'FAILED';
  pdf_path: string | null;
  generated_at: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    work_email: string;
    bank_account_number: string | null;
    company_id: string;
    department?: { id: string; name: string } | null;
    job_position?: { id: string; title: string } | null;
  };
  payrun?: {
    id: string;
    name: string;
    status: string;
    company?: { id: string; name: string; currency: string; tax_id: string | null };
  };
  items?: PayslipItem[];
}

export interface PayslipDeliveryRecord {
  id: string;
  payslip_id: string;
  email: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  payslip?: {
    id: string;
    period_start: string;
    period_end: string;
    net_salary: number;
    employee?: { first_name: string; last_name: string; work_email: string };
  };
}

// Dashboard
export interface DashboardKpis {
  headcount: {
    total: number;
    active: number;
    inactive: number;
    terminated: number;
    byType: Record<string, number>;
  };
  payroll: {
    totalNetSalaryPaid: number;
    totalGrossSalaryPaid: number;
    totalDeductions: number;
    payslipsGenerated: number;
    averageNetSalary: number;
    totalPayrunsCount: number;
  };
  timeOffHealth: {
    pendingRequests: number;
    approvedRequests: number;
    activeAllocations: number;
  };
}

export interface DepartmentSalaryItem {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  headcount: number;
  activeContractCount: number;
  totalWage: number;
  averageWage: number;
  totalPaidNet: number;
  totalPaidGross: number;
}

export interface SalaryTrendItem {
  period: string;
  periodStart: string;
  periodEnd: string;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  employeeCount: number;
  payrunCount: number;
}

export interface AttendanceOverview {
  period: {
    startDate: string;
    endDate: string;
  };
  totalRecords: number;
  breakdown: {
    present: number;
    absent: number;
    late: number;
    overtime: number;
    missingCheckout: number;
  };
  totalWorkedHours: number;
  totalOvertimeHours: number;
  attendanceRate: number;
}

export interface OperationalAlerts {
  summary: {
    totalAlerts: number;
    missingBankDetailsCount: number;
    expiringContractsCount: number;
    pendingLeaveRequestsCount: number;
    unresolvedWarningsCount: number;
  };
  alerts: {
    missingBankDetails: Array<{
      employeeId: string;
      employeeCode: string;
      firstName: string;
      lastName: string;
      departmentName?: string | null;
    }>;
    expiringContracts: Array<{
      contractId: string;
      employeeId: string;
      employeeCode: string;
      employeeName: string;
      endDate: string;
      daysRemaining: number;
    }>;
    pendingLeaveRequests: Array<{
      requestId: string;
      employeeId: string;
      employeeName: string;
      timeOffTypeName: string;
      startDate: string;
      endDate: string;
      duration: number;
    }>;
    unresolvedWarnings: Array<{
      warningId: string;
      payrunId: string;
      payrunName?: string | null;
      employeeName?: string | null;
      type: string;
      severity: string;
      message: string;
    }>;
  };
}

// Audit Logs
export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  created_at: string;
  user?: {
    id: string;
    auth_user_id: string;
    employee_id: string | null;
    employee?: {
      id: string;
      first_name: string;
      last_name: string;
      employee_code: string;
      company_id: string;
    } | null;
  } | null;
}

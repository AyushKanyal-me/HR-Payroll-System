import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Shell } from './components/layout/Shell';
import { RoleGuard } from './components/layout/RoleGuard';

// Auth
import { Login } from './pages/auth/Login';
import { SetupAccount } from './pages/auth/SetupAccount';

// Portal (Employee)
import { EmployeePortal } from './pages/portal/EmployeePortal';
import { MyAttendance } from './pages/portal/MyAttendance';
import { MyTimeOff } from './pages/portal/MyTimeOff';
import { MyPayslips } from './pages/portal/MyPayslips';

// Management & Admin
import { Dashboard } from './pages/dashboard/Dashboard';
import { EmployeeKanban } from './pages/employees/EmployeeKanban';
import { EmployeeList } from './pages/employees/EmployeeList';
import { EmployeeDetail } from './pages/employees/EmployeeDetail';
import { ContractList } from './pages/contracts/ContractList';
import { ContractDetail } from './pages/contracts/ContractDetail';
import { DepartmentList } from './pages/org/DepartmentList';
import { PositionList } from './pages/org/PositionList';
import { ScheduleList } from './pages/org/ScheduleList';
import { AttendanceList } from './pages/attendance/AttendanceList';
import { TimeOffRequests } from './pages/timeoff/TimeOffRequests';
import { TimeOffAllocations } from './pages/timeoff/TimeOffAllocations';
import { SalaryStructures } from './pages/salary/SalaryStructures';
import { SalaryRules } from './pages/salary/SalaryRules';
import { PayrunList } from './pages/payroll/PayrunList';
import { PayrunDetail } from './pages/payroll/PayrunDetail';
import { PayslipList } from './pages/payslips/PayslipList';
import { AuditLogs } from './pages/audit/AuditLogs';
import { SettingsPage } from './pages/settings/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup-account" element={<SetupAccount />} />

            {/* Authenticated Layout */}
            <Route element={<RoleGuard />}>
              <Route element={<Shell />}>
                {/* Employee Self-Service */}
                <Route path="/portal" element={<EmployeePortal />} />
                <Route path="/my-attendance" element={<MyAttendance />} />
                <Route path="/my-time-off" element={<MyTimeOff />} />
                <Route path="/my-payslips" element={<MyPayslips />} />

                {/* Management & Shared Routes */}
                <Route element={<RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/employees" element={<EmployeeKanban />} />
                  <Route path="/employees/list" element={<EmployeeList />} />
                  <Route path="/employees/:id" element={<EmployeeDetail />} />
                  <Route path="/contracts" element={<ContractList />} />
                  <Route path="/contracts/:id" element={<ContractDetail />} />
                  <Route path="/departments" element={<DepartmentList />} />
                  <Route path="/positions" element={<PositionList />} />
                  <Route path="/schedules" element={<ScheduleList />} />
                  <Route path="/attendance" element={<AttendanceList />} />
                  <Route path="/salary-structures" element={<SalaryStructures />} />
                  <Route path="/salary-rules" element={<SalaryRules />} />
                  <Route path="/payroll" element={<PayrunList />} />
                  <Route path="/payroll/:id" element={<PayrunDetail />} />
                  <Route path="/payslips" element={<PayslipList />} />
                </Route>

                {/* HR Manager & Admin Exclusive (Time-off & Leave Allocations) */}
                <Route element={<RoleGuard allowedRoles={['ADMIN', 'HR_MANAGER']} />}>
                  <Route path="/time-off" element={<TimeOffRequests />} />
                  <Route path="/time-off-allocations" element={<TimeOffAllocations />} />
                </Route>

                {/* System Admin Exclusive */}
                <Route element={<RoleGuard allowedRoles={['ADMIN']} />}>
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                {/* Root Redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

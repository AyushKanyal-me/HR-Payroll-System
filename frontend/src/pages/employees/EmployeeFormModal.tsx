import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../context/ToastContext';
import { departmentsApi, positionsApi, schedulesApi, employeesApi } from '../../api/endpoints';
import { Employee, Department, JobPosition, WorkingSchedule } from '../../types';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee | null;
}

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'd0000000-0000-0000-0000-000000000001', company_id: 'a0000000-0000-0000-0000-000000000001', name: 'Engineering', code: 'ENG', parent_department_id: null, manager_id: null, created_at: '', updated_at: '' },
  { id: 'd0000000-0000-0000-0000-000000000002', company_id: 'a0000000-0000-0000-0000-000000000001', name: 'Human Resources', code: 'HR', parent_department_id: null, manager_id: null, created_at: '', updated_at: '' },
  { id: 'd0000000-0000-0000-0000-000000000003', company_id: 'a0000000-0000-0000-0000-000000000001', name: 'Product & Design', code: 'PD', parent_department_id: null, manager_id: null, created_at: '', updated_at: '' },
  { id: 'd0000000-0000-0000-0000-000000000004', company_id: 'a0000000-0000-0000-0000-000000000001', name: 'Sales & Growth', code: 'SALES', parent_department_id: null, manager_id: null, created_at: '', updated_at: '' },
];

const DEFAULT_POSITIONS: JobPosition[] = [
  { id: 'b0000000-0000-0000-0000-000000000011', department_id: 'd0000000-0000-0000-0000-000000000001', title: 'Senior Software Engineer', code: 'SR_SWE', description: null, created_at: '', updated_at: '' },
  { id: 'b0000000-0000-0000-0000-000000000012', department_id: 'd0000000-0000-0000-0000-000000000001', title: 'Frontend Specialist', code: 'FE_SPEC', description: null, created_at: '', updated_at: '' },
  { id: 'b0000000-0000-0000-0000-000000000013', department_id: 'd0000000-0000-0000-0000-000000000002', title: 'HR Generalist', code: 'HR_GEN', description: null, created_at: '', updated_at: '' },
  { id: 'b0000000-0000-0000-0000-000000000014', department_id: 'd0000000-0000-0000-0000-000000000003', title: 'Product Manager', code: 'PM', description: null, created_at: '', updated_at: '' },
];

const DEFAULT_SCHEDULES: WorkingSchedule[] = [
  { id: 'c0000000-0000-0000-0000-000000000001', company_id: 'a0000000-0000-0000-0000-000000000001', name: 'Standard 40h Weekly (Mon-Fri)', schedule_type: 'FIXED', days_per_week: 5, hours_per_week: 40, timezone: 'Asia/Kolkata', is_active: true, created_at: '', updated_at: '' },
  { id: 'c0000000-0000-0000-0000-000000000002', company_id: 'a0000000-0000-0000-0000-000000000001', name: 'Flexible Tech Schedule (40h)', schedule_type: 'FLEXIBLE', days_per_week: 5, hours_per_week: 40, timezone: 'Asia/Kolkata', is_active: true, created_at: '', updated_at: '' },
];

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employee,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [positions, setPositions] = useState<JobPosition[]>(DEFAULT_POSITIONS);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>(DEFAULT_SCHEDULES);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    work_email: '',
    personal_email: '',
    phone: '',
    hire_date: new Date().toISOString().split('T')[0],
    employment_type: 'FULL_TIME',
    status: 'ACTIVE',
    department_id: '',
    job_position_id: '',
    schedule_id: '',
    portal_role: 'EMPLOYEE' as 'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_MANAGER' | 'HR_PAYROLL_USER' | 'ADMIN',
    send_invite: true,
    bank_account_number: '',
    bank_name: '',
    bank_ifsc: '',
    pan_number: '',
    aadhaar_number: '',
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        departmentsApi.getAll(),
        positionsApi.getAll(),
        schedulesApi.getAll(),
      ]).then(([dRes, pRes, sRes]) => {
        if (dRes.success && Array.isArray(dRes.data) && dRes.data.length > 0) {
          setDepartments(dRes.data);
        }
        if (pRes.success && Array.isArray(pRes.data) && pRes.data.length > 0) {
          setPositions(pRes.data);
        }
        if (sRes.success && Array.isArray(sRes.data) && sRes.data.length > 0) {
          setSchedules(sRes.data);
        }
      }).catch(() => {});

      if (employee) {
        setForm({
          first_name: employee.first_name || '',
          last_name: employee.last_name || '',
          work_email: employee.work_email || '',
          personal_email: employee.personal_email || '',
          phone: employee.phone || '',
          hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : new Date().toISOString().split('T')[0],
          employment_type: employee.employee_type || employee.employment_type || 'FULL_TIME',
          status: employee.status || 'ACTIVE',
          department_id: employee.department_id || '',
          job_position_id: employee.job_position_id || '',
          schedule_id: employee.schedule_id || '',
          portal_role: 'EMPLOYEE',
          send_invite: false,
          bank_account_number: employee.bank_account_number || '',
          bank_name: employee.bank_name || '',
          bank_ifsc: employee.bank_ifsc || '',
          pan_number: employee.pan_number || '',
          aadhaar_number: employee.aadhaar_number || '',
        });
      } else {
        setForm({
          first_name: '',
          last_name: '',
          work_email: '',
          personal_email: '',
          phone: '',
          hire_date: new Date().toISOString().split('T')[0],
          employment_type: 'FULL_TIME',
          status: 'ACTIVE',
          department_id: '',
          job_position_id: '',
          schedule_id: '',
          portal_role: 'EMPLOYEE',
          send_invite: true,
          bank_account_number: '',
          bank_name: '',
          bank_ifsc: '',
          pan_number: '',
          aadhaar_number: '',
        });
      }
    }
  }, [isOpen, employee]);

  const isValidUuid = (id?: string | null): boolean => {
    return Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
  };

  const cleanString = (val?: string | null): string | null => {
    if (!val || val.trim() === '') return null;
    return val.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        work_email: form.work_email.trim(),
        company_id: 'a0000000-0000-0000-0000-000000000001',
        personal_email: cleanString(form.personal_email),
        phone: cleanString(form.phone),
        hire_date: form.hire_date,
        employee_type: form.employment_type,
        employment_type: form.employment_type,
        status: form.status,
        department_id: isValidUuid(form.department_id) ? form.department_id : null,
        job_position_id: isValidUuid(form.job_position_id) ? form.job_position_id : null,
        schedule_id: isValidUuid(form.schedule_id) ? form.schedule_id : null,
        bank_name: cleanString(form.bank_name),
        bank_account_number: cleanString(form.bank_account_number),
        bank_ifsc: cleanString(form.bank_ifsc),
        pan_number: cleanString(form.pan_number),
        aadhaar_number: cleanString(form.aadhaar_number),
      };

      let targetEmpId = employee?.id;
      if (employee?.id) {
        await employeesApi.update(employee.id, payload);
        toast.success('Employee Updated', 'Record saved successfully.');
      } else {
        const createRes = await employeesApi.create(payload);
        targetEmpId = (createRes as any)?.data?.id || (createRes as any)?.id;
        toast.success('Employee Created', 'New employee onboarded.');
      }

      if (form.send_invite && targetEmpId) {
        try {
          await employeesApi.invite(targetEmpId, { role: form.portal_role });
          toast.success('Access Configured', `Granted portal access as ${form.portal_role.replace(/_/g, ' ')}.`);
        } catch (invErr: any) {
          console.warn('Invite notification warning:', invErr);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Operation Failed', err.message || 'Failed to save employee.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? 'Edit Employee Profile' : 'Onboard New Employee'}
      subtitle="Enter personal, organizational, and statutory payroll details"
      maxWidth="840px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Row 1: Personal Contact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr', gap: '8px' }}>
          <Input
            label="First Name"
            required
            placeholder="e.g. Ayush"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          />
          <Input
            label="Last Name"
            required
            placeholder="e.g. Sharma"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          />
          <Input
            label="Work Email"
            type="email"
            required
            placeholder="name@company.com"
            value={form.work_email}
            onChange={(e) => setForm({ ...form, work_email: e.target.value })}
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          />
          <Input
            label="Phone Number"
            placeholder="+91 98765..."
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          />
        </div>

        {/* Row 2: Organization Hierarchy */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.2fr 1fr', gap: '8px' }}>
          <Select
            label="Department"
            placeholder="Select Department"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            value={form.department_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            style={{ padding: '6px 28px 6px 10px', fontSize: '0.8125rem' }}
          />
          <Select
            label="Job Position"
            placeholder="Select Position"
            options={positions.map((p) => ({ value: p.id, label: p.title || (p as any).name }))}
            value={form.job_position_id}
            onChange={(e) => setForm({ ...form, job_position_id: e.target.value })}
            style={{ padding: '6px 28px 6px 10px', fontSize: '0.8125rem' }}
          />
          <Select
            label="Working Schedule"
            placeholder="Select Schedule"
            options={schedules.map((s) => ({ value: s.id, label: s.name + ' (' + s.hours_per_week + 'h)' }))}
            value={form.schedule_id}
            onChange={(e) => setForm({ ...form, schedule_id: e.target.value })}
            style={{ padding: '6px 28px 6px 10px', fontSize: '0.8125rem' }}
          />
          <Input
            label="Hire Date"
            type="date"
            required
            value={form.hire_date}
            onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          />
        </div>

        {/* Row 3: Employment Terms & Bank */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1.2fr', gap: '8px' }}>
          <Select
            label="Employment Type"
            options={[
              { value: 'FULL_TIME', label: 'Full-Time' },
              { value: 'PART_TIME', label: 'Part-Time' },
              { value: 'CONTRACT', label: 'Contractor' },
              { value: 'INTERN', label: 'Intern' },
            ]}
            value={form.employment_type}
            onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
            style={{ padding: '6px 28px 6px 10px', fontSize: '0.8125rem' }}
          />
          <Select
            label="Status"
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'TERMINATED', label: 'Terminated' },
            ]}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={{ padding: '6px 28px 6px 10px', fontSize: '0.8125rem' }}
          />
          <Input
            label="Bank Name"
            placeholder="e.g. HDFC Bank"
            value={form.bank_name}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          />
          <Input
            label="Account Number"
            placeholder="5010023491..."
            value={form.bank_account_number}
            onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          />
        </div>

        {/* Row 4: System Role & Portal Access */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px', alignItems: 'center', backgroundColor: '#141416', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <Select
            label="System & Portal Role"
            options={[
              { value: 'EMPLOYEE', label: 'Employee (Self-Service Portal Only)' },
              { value: 'HR_MANAGER', label: 'HR Manager (Workforce & Leave Approvals)' },
              { value: 'HR_PAYROLL_MANAGER', label: 'Payroll Manager (Full Payroll Engine & Approval)' },
              { value: 'HR_PAYROLL_USER', label: 'Payroll Specialist (Payroll & Payslip Viewer)' },
              { value: 'ADMIN', label: 'Administrator (Full System Access)' },
            ]}
            value={form.portal_role}
            onChange={(e) => setForm({ ...form, portal_role: e.target.value as any })}
            style={{ padding: '6px 28px 6px 10px', fontSize: '0.8125rem' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', color: '#f4f4f5' }}>
              <input
                type="checkbox"
                checked={form.send_invite}
                onChange={(e) => setForm({ ...form, send_invite: e.target.checked })}
                style={{ accentColor: 'var(--primary-red)', cursor: 'pointer' }}
              />
              <span>Grant access & send onboarding invite</span>
            </label>
          </div>
        </div>

        {/* Row 5: Statutory & Action Buttons in single line */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.4fr', gap: '8px', alignItems: 'flex-end', paddingTop: '4px' }}>
          <Input
            label="IFSC Code"
            placeholder="HDFC0001234"
            value={form.bank_ifsc}
            onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })}
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          />
          <Input
            label="PAN Number (Opt)"
            placeholder="ABCDE1234F"
            value={form.pan_number}
            onChange={(e) => setForm({ ...form, pan_number: e.target.value })}
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          />
          <Input
            label="Aadhaar (Opt)"
            placeholder="1234 5678 9012"
            value={form.aadhaar_number}
            onChange={(e) => setForm({ ...form, aadhaar_number: e.target.value })}
            style={{ padding: '6px 10px', fontSize: '0.8125rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="outline" type="button" onClick={onClose} style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting} style={{ padding: '6px 16px', fontSize: '0.8125rem' }}>
              {employee ? 'Save Changes' : 'Create Employee'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

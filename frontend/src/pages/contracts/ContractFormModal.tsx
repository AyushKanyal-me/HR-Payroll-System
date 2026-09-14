import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { contractsApi, employeesApi, salaryApi, schedulesApi, departmentsApi, positionsApi } from '../../api/endpoints';
import { Contract, Employee, SalaryStructure, WorkingSchedule, Department, JobPosition } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contract?: Contract | null;
}

const DEFAULT_STRUCTURES: SalaryStructure[] = [
  { id: 'b0000000-0000-0000-0000-000000000001', company_id: 'a0000000-0000-0000-0000-000000000001', name: 'Standard Monthly Salary', code: 'STD_MONTHLY', description: 'Basic + HRA + Transport - PF - PT', is_active: true, created_at: '', updated_at: '' },
  { id: 'b0000000-0000-0000-0000-000000000002', company_id: 'a0000000-0000-0000-0000-000000000001', name: 'Executive Tech Structure', code: 'EXEC_TECH', description: 'Tech Leadership Compensation Structure', is_active: true, created_at: '', updated_at: '' },
];

const DEFAULT_SCHEDULES: WorkingSchedule[] = [
  { id: 's0000000-0000-0000-0000-000000000001', company_id: 'a0000000-0000-0000-0000-000000000001', name: 'Standard 40h Weekly (Mon-Fri)', schedule_type: 'FIXED', days_per_week: 5, hours_per_week: 40, timezone: 'Asia/Kolkata', is_active: true, created_at: '', updated_at: '' },
];

export const ContractFormModal: React.FC<ContractFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contract,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>(DEFAULT_STRUCTURES);
  const [schedules, setSchedules] = useState<WorkingSchedule[]>(DEFAULT_SCHEDULES);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<JobPosition[]>([]);

  const [form, setForm] = useState({
    employee_id: '',
    wage: 50000,
    currency: 'INR',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    employment_type: 'FULL_TIME',
    status: 'ACTIVE',
    salary_structure_id: '',
    schedule_id: '',
    department_id: '',
    job_position_id: '',
  });

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        employeesApi.getAll(),
        salaryApi.getStructures({ is_active: true }),
        schedulesApi.getAll(),
        departmentsApi.getAll(),
        positionsApi.getAll(),
      ]).then(([empRes, structRes, schedRes, deptRes, posRes]) => {
        if (empRes.success && Array.isArray(empRes.data)) setEmployees(empRes.data);
        if (structRes.success && Array.isArray(structRes.data) && structRes.data.length > 0) setStructures(structRes.data);
        if (schedRes.success && Array.isArray(schedRes.data) && schedRes.data.length > 0) setSchedules(schedRes.data);
        if (deptRes.success && Array.isArray(deptRes.data)) setDepartments(deptRes.data);
        if (posRes.success && Array.isArray(posRes.data)) setPositions(posRes.data);
      }).catch(() => {});

      if (contract) {
        setForm({
          employee_id: contract.employee_id,
          wage: contract.wage,
          currency: contract.currency || 'INR',
          start_date: contract.start_date.split('T')[0],
          end_date: contract.end_date ? contract.end_date.split('T')[0] : '',
          employment_type: contract.employment_type || 'FULL_TIME',
          status: contract.status || 'ACTIVE',
          salary_structure_id: contract.salary_structure_id || '',
          schedule_id: contract.schedule_id || '',
          department_id: contract.department_id || '',
          job_position_id: contract.job_position_id || '',
        });
      } else {
        setForm({
          employee_id: '',
          wage: 50000,
          currency: 'INR',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          employment_type: 'FULL_TIME',
          status: 'ACTIVE',
          salary_structure_id: '',
          schedule_id: '',
          department_id: '',
          job_position_id: '',
        });
      }
    }
  }, [isOpen, contract]);

  const isValidUuid = (id?: string | null): boolean => {
    return Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Record<string, any> = {
        employee_id: form.employee_id,
        wage: Number(form.wage),
        currency: form.currency || 'INR',
        start_date: form.start_date,
        end_date: form.end_date ? form.end_date : null,
        employment_type: form.employment_type,
        status: form.status,
        salary_structure_id: isValidUuid(form.salary_structure_id) ? form.salary_structure_id : null,
        schedule_id: isValidUuid(form.schedule_id) ? form.schedule_id : null,
        department_id: isValidUuid(form.department_id) ? form.department_id : null,
        job_position_id: isValidUuid(form.job_position_id) ? form.job_position_id : null,
      };

      if (contract?.id) {
        await contractsApi.update(contract.id, payload);
        toast.success('Contract Updated', 'Contract parameters adjusted.');
      } else {
        await contractsApi.create(payload);
        toast.success('Contract Created', 'New active employment contract registered.');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Contract Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeSelect = (empId: string) => {
    const chosen = employees.find((e) => e.id === empId);
    setForm((prev) => ({
      ...prev,
      employee_id: empId,
      department_id: chosen?.department_id || prev.department_id,
      job_position_id: chosen?.job_position_id || prev.job_position_id,
      schedule_id: chosen?.schedule_id || prev.schedule_id,
      employment_type: chosen?.employee_type || chosen?.employment_type || prev.employment_type,
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contract ? 'Edit Contract' : 'Draft Employment Contract'}
      subtitle="Configure compensation, schedule & salary structure"
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Select
          label="Employee"
          required
          placeholder="Select Employee"
          disabled={Boolean(contract)}
          options={employees.map((e) => ({ value: e.id, label: e.first_name + ' ' + e.last_name + ' (' + e.work_email + ')' }))}
          value={form.employee_id}
          onChange={(e) => handleEmployeeSelect(e.target.value)}
          style={{ padding: '7px 32px 7px 10px', fontSize: '0.825rem' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Select
            label="Department"
            placeholder="Select Department"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            value={form.department_id}
            onChange={(e) => setForm({ ...form, department_id: e.target.value })}
            style={{ padding: '7px 32px 7px 10px', fontSize: '0.825rem' }}
          />
          <Select
            label="Job Position"
            placeholder="Select Position"
            options={positions.map((p) => ({ value: p.id, label: p.title || (p as any).name }))}
            value={form.job_position_id}
            onChange={(e) => setForm({ ...form, job_position_id: e.target.value })}
            style={{ padding: '7px 32px 7px 10px', fontSize: '0.825rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
          <Input
            label="Base Wage / Month"
            type="number"
            required
            min="0"
            value={form.wage}
            onChange={(e) => setForm({ ...form, wage: parseFloat(e.target.value) })}
            style={{ padding: '7px 10px', fontSize: '0.825rem' }}
          />
          <Input
            label="Currency"
            value={form.currency}
            disabled
            style={{ padding: '7px 10px', fontSize: '0.825rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Input
            label="Start Date"
            type="date"
            required
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            style={{ padding: '7px 10px', fontSize: '0.825rem' }}
          />
          <Input
            label="End Date (Optional)"
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            style={{ padding: '7px 10px', fontSize: '0.825rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Select
            label="Salary Structure"
            placeholder="Select Structure"
            options={structures.map((s) => ({ value: s.id, label: s.name + ' (' + s.code + ')' }))}
            value={form.salary_structure_id}
            onChange={(e) => setForm({ ...form, salary_structure_id: e.target.value })}
            style={{ padding: '7px 32px 7px 10px', fontSize: '0.825rem' }}
          />
          <Select
            label="Working Schedule"
            placeholder="Select Schedule"
            options={schedules.map((s) => ({ value: s.id, label: s.name + ' (' + s.hours_per_week + 'h)' }))}
            value={form.schedule_id}
            onChange={(e) => setForm({ ...form, schedule_id: e.target.value })}
            style={{ padding: '7px 32px 7px 10px', fontSize: '0.825rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Select
            label="Employment Type"
            options={[
              { value: 'FULL_TIME', label: 'Full-Time' },
              { value: 'PART_TIME', label: 'Part-Time' },
              { value: 'CONTRACT', label: 'Contract' },
              { value: 'INTERN', label: 'Intern' },
            ]}
            value={form.employment_type}
            onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
            style={{ padding: '7px 32px 7px 10px', fontSize: '0.825rem' }}
          />
          <Select
            label="Status"
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'EXPIRED', label: 'Expired' },
              { value: 'TERMINATED', label: 'Terminated' },
            ]}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            style={{ padding: '7px 32px 7px 10px', fontSize: '0.825rem' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
          <Button variant="outline" type="button" onClick={onClose} style={{ padding: '7px 14px', fontSize: '0.825rem' }}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting} style={{ padding: '7px 18px', fontSize: '0.825rem' }}>
            {contract ? 'Save Changes' : 'Generate Contract'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

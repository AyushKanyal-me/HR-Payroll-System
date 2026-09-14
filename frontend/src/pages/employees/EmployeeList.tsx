import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeesApi } from '../../api/endpoints';
import { Employee } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import { Users, LayoutGrid, Plus } from 'lucide-react';
import { EmployeeFormModal } from './EmployeeFormModal';

export const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await employeesApi.getAll();
      if (res.success && res.data) setEmployees(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Full Name',
      render: (e) => <span style={{ fontWeight: 600 }}>{e.first_name} {e.last_name}</span>,
    },
    {
      key: 'email',
      header: 'Work Email',
      render: (e) => <span style={{ color: 'var(--text-muted)' }}>{e.work_email}</span>,
    },
    {
      key: 'job_position',
      header: 'Position',
      render: (e) => e.job_position?.title || '—',
    },
    {
      key: 'department',
      header: 'Department',
      render: (e) => e.department?.name || '—',
    },
    {
      key: 'hire_date',
      header: 'Hire Date',
      render: (e) => formatDate(e.hire_date),
    },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <Badge status={e.status} />,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={22} color="var(--primary-red)" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Employees (Table View)</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/employees')}>
            <LayoutGrid size={15} style={{ marginRight: '6px' }} /> Kanban Cards
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            Add Employee
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        onRowClick={(emp) => navigate('/employees/' + emp.id)}
      />

      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

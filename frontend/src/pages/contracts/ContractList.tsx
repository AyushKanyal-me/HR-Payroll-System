import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { contractsApi } from '../../api/endpoints';
import { Contract } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { FileSignature, Plus } from 'lucide-react';
import { ContractFormModal } from './ContractFormModal';

export const ContractList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employee_id');

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await contractsApi.getAll({
        employee_id: employeeIdParam || undefined,
      });
      if (res.success && res.data) setContracts(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [employeeIdParam]);

  const columns: Column<Contract>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (c) => (
        <span style={{ fontWeight: 600 }}>
          {c.employee ? c.employee.first_name + ' ' + c.employee.last_name : '—'}
        </span>
      ),
    },
    {
      key: 'wage',
      header: 'Wage / Month',
      render: (c) => (
        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
          {formatCurrency(c.wage, c.currency)}
        </span>
      ),
    },
    {
      key: 'structure',
      header: 'Salary Structure',
      render: (c) => c.salary_structure?.name || 'Standard Structure',
    },
    {
      key: 'start_date',
      header: 'Start Date',
      render: (c) => formatDate(c.start_date),
    },
    {
      key: 'end_date',
      header: 'End Date',
      render: (c) => (c.end_date ? formatDate(c.end_date) : 'Open-ended'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => <Badge status={c.status} />,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileSignature size={22} color="var(--primary-red)" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Employment Contracts</h1>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
          New Contract
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        onRowClick={(c) => navigate('/contracts/' + c.id)}
      />

      <ContractFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { payrollApi, salaryApi } from '../../api/endpoints';
import { Payrun, SalaryStructure } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Banknote, Plus, ArrowRight } from 'lucide-react';

export const PayrunList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: 'Payroll ' + new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    period_end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
    salary_structure_id: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        payrollApi.getPayruns(),
        salaryApi.getStructures({ is_active: true }),
      ]);
      if (pRes.success && pRes.data) setPayruns(pRes.data);
      if (sRes.success && sRes.data) setStructures(sRes.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await payrollApi.createPayrun({
        ...form,
        company_id: 'a0000000-0000-0000-0000-000000000001',
      });
      toast.success('Payrun Created', 'Draft payrun ready for computation.');
      setIsModalOpen(false);
      if (res.data?.id) {
        navigate('/payroll/' + res.data.id);
      } else {
        loadData();
      }
    } catch (err: any) {
      toast.error('Failed to Create Payrun', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Payrun>[] = [
    {
      key: 'name',
      header: 'Payrun Name',
      render: (p) => <span style={{ fontWeight: 600 }}>{p.name}</span>,
    },
    {
      key: 'period',
      header: 'Period',
      render: (p) => (
        <span>
          {formatDate(p.period_start)} – {formatDate(p.period_end)}
        </span>
      ),
    },
    {
      key: 'total_employees',
      header: 'Employees',
      render: (p) => p.total_employees + ' employees',
    },
    {
      key: 'total_net',
      header: 'Net Total',
      render: (p) => <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{formatCurrency(p.total_net)}</span>,
    },
    {
      key: 'status',
      header: 'Lifecycle State',
      render: (p) => <Badge status={p.status} />,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Banknote size={22} color="var(--primary-red)" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Payroll Execution Engine</h1>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
          New Payrun
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={payruns}
        isLoading={isLoading}
        onRowClick={(p) => navigate('/payroll/' + p.id)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Payrun Batch"
        subtitle="Initialize a monthly or bi-weekly payroll calculation"
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Payrun Name / Title"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Period Start"
              type="date"
              required
              value={form.period_start}
              onChange={(e) => setForm({ ...form, period_start: e.target.value })}
            />
            <Input
              label="Period End"
              type="date"
              required
              value={form.period_end}
              onChange={(e) => setForm({ ...form, period_end: e.target.value })}
            />
          </div>
          <Select
            label="Salary Structure"
            required
            placeholder="Select Structure"
            options={structures.map((s) => ({ value: s.id, label: s.name + ' (' + s.code + ')' }))}
            value={form.salary_structure_id}
            onChange={(e) => setForm({ ...form, salary_structure_id: e.target.value })}
          />
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', backgroundColor: '#141416', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            ℹ️ All active employees in your organization will be automatically enrolled in this payrun batch. You can adjust and add/remove employees anytime before computation.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Initialize Batch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

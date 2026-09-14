import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { salaryApi } from '../../api/endpoints';
import { SalaryRule } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatCurrency } from '../../utils/formatters';
import { Calculator, Plus, Edit } from 'lucide-react';

export const SalaryRules: React.FC = () => {
  const toast = useToast();
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<SalaryRule | null>(null);

  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'ALLOWANCE',
    calculation_type: 'PERCENTAGE',
    fixed_amount: 0,
    percentage: 10,
    formula: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await salaryApi.getRules();
      if (res.success && res.data) setRules(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setSelectedRule(null);
    setForm({
      name: '',
      code: '',
      category: 'ALLOWANCE',
      calculation_type: 'PERCENTAGE',
      fixed_amount: 0,
      percentage: 10,
      formula: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (r: SalaryRule) => {
    setSelectedRule(r);
    setForm({
      name: r.name,
      code: r.code,
      category: r.category,
      calculation_type: r.calculation_type,
      fixed_amount: r.fixed_amount || 0,
      percentage: r.percentage || 0,
      formula: r.formula || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        fixed_amount: form.calculation_type === 'FIXED' ? form.fixed_amount : null,
        percentage: form.calculation_type === 'PERCENTAGE' ? form.percentage : null,
        formula: form.calculation_type === 'FORMULA' ? form.formula : null,
      };

      if (selectedRule) {
        await salaryApi.updateRule(selectedRule.id, payload);
        toast.success('Salary Rule Updated', 'Rule configuration saved.');
      } else {
        await salaryApi.createRule(payload);
        toast.success('Salary Rule Created', 'New rule added to catalog.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<SalaryRule>[] = [
    {
      key: 'name',
      header: 'Rule Name',
      render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span>,
    },
    {
      key: 'code',
      header: 'Code',
      render: (r) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-red)' }}>{r.code}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => <Badge status={r.category} />,
    },
    {
      key: 'calc_type',
      header: 'Calculation',
      render: (r) => {
        if (r.calculation_type === 'PERCENTAGE') return r.percentage + '% of Base';
        if (r.calculation_type === 'FIXED') return formatCurrency(r.fixed_amount);
        return <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{r.formula || 'Formula'}</span>;
      },
    },
    {
      key: 'status',
      header: 'Active',
      render: (r) => <Badge status={r.is_active ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (r) => (
        <Button size="sm" variant="ghost" leftIcon={<Edit size={14} />} onClick={() => openEdit(r)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calculator size={22} color="var(--primary-red)" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Salary Rules Catalog</h1>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={openCreate}>
          New Salary Rule
        </Button>
      </div>

      <DataTable columns={columns} data={rules} isLoading={isLoading} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRule ? 'Edit Salary Rule' : 'Create Salary Rule'}
        subtitle="Define payroll computation component and logic"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input label="Rule Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Rule Code" required placeholder="HRA, PF, TAX..." value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Select
              label="Category"
              options={[
                { value: 'BASIC', label: 'Basic Salary' },
                { value: 'ALLOWANCE', label: 'Allowance' },
                { value: 'GROSS', label: 'Gross Total' },
                { value: 'DEDUCTION', label: 'Deduction' },
                { value: 'NET', label: 'Net Total' },
              ]}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <Select
              label="Calculation Type"
              options={[
                { value: 'PERCENTAGE', label: 'Percentage (%)' },
                { value: 'FIXED', label: 'Fixed Amount (₹)' },
                { value: 'FORMULA', label: 'Mathematical Formula' },
              ]}
              value={form.calculation_type}
              onChange={(e) => setForm({ ...form, calculation_type: e.target.value })}
            />
          </div>

          {form.calculation_type === 'PERCENTAGE' && (
            <Input
              label="Percentage of Base (%)"
              type="number"
              step="0.1"
              value={form.percentage}
              onChange={(e) => setForm({ ...form, percentage: parseFloat(e.target.value) })}
            />
          )}

          {form.calculation_type === 'FIXED' && (
            <Input
              label="Fixed Amount (₹)"
              type="number"
              value={form.fixed_amount}
              onChange={(e) => setForm({ ...form, fixed_amount: parseFloat(e.target.value) })}
            />
          )}

          {form.calculation_type === 'FORMULA' && (
            <Input
              label="Formula Expression"
              placeholder="e.g. BASIC * 0.4 + ALLOWANCES"
              value={form.formula}
              onChange={(e) => setForm({ ...form, formula: e.target.value })}
            />
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

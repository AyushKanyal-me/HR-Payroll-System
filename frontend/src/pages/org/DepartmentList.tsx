import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { departmentsApi } from '../../api/endpoints';
import { Department } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Building2, Plus, Edit } from 'lucide-react';

export const DepartmentList: React.FC = () => {
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await departmentsApi.getAll();
      if (res.success && res.data) setDepartments(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setSelectedDept(null);
    setName('');
    setCode('');
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setSelectedDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (selectedDept) {
        await departmentsApi.update(selectedDept.id, { name, code });
        toast.success('Department Updated', 'Changes saved.');
      } else {
        await departmentsApi.create({ name, code });
        toast.success('Department Created', 'New department added.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Action Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'Department Name',
      render: (d) => <span style={{ fontWeight: 600 }}>{d.name}</span>,
    },
    {
      key: 'code',
      header: 'Code',
      render: (d) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-red)' }}>{d.code}</span>,
    },
    {
      key: 'manager',
      header: 'Department Head',
      render: (d) => (d.manager ? d.manager.first_name + ' ' + d.manager.last_name : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <Button size="sm" variant="ghost" leftIcon={<Edit size={14} />} onClick={() => openEditModal(d)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Building2 size={22} color="var(--primary-red)" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Departments</h1>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={openCreateModal}>
          Add Department
        </Button>
      </div>

      <DataTable columns={columns} data={departments} isLoading={isLoading} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedDept ? 'Edit Department' : 'Create Department'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Department Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Department Code" required value={code} onChange={(e) => setCode(e.target.value)} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

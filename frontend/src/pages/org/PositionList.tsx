import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { positionsApi, departmentsApi } from '../../api/endpoints';
import { JobPosition, Department } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Briefcase, Plus, Edit } from 'lucide-react';

export const PositionList: React.FC = () => {
  const toast = useToast();
  const [positions, setPositions] = useState<JobPosition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPos, setSelectedPos] = useState<JobPosition | null>(null);

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [posRes, deptRes] = await Promise.all([
        positionsApi.getAll(),
        departmentsApi.getAll(),
      ]);
      if (posRes.success && posRes.data) setPositions(posRes.data);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
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
    setSelectedPos(null);
    setTitle('');
    setCode('');
    setDepartmentId('');
    setIsModalOpen(true);
  };

  const openEdit = (pos: JobPosition) => {
    setSelectedPos(pos);
    setTitle(pos.title);
    setCode(pos.code);
    setDepartmentId(pos.department_id || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title,
        name: title,
        code,
        department_id: departmentId || null,
        company_id: 'a0000000-0000-0000-0000-000000000001',
      };
      if (selectedPos) {
        await positionsApi.update(selectedPos.id, payload);
        toast.success('Position Updated', 'Saved.');
      } else {
        await positionsApi.create(payload);
        toast.success('Position Created', 'New job role registered.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Action Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<JobPosition>[] = [
    {
      key: 'title',
      header: 'Position Title',
      render: (p) => <span style={{ fontWeight: 600 }}>{p.title || (p as any).name}</span>,
    },
    {
      key: 'code',
      header: 'Code',
      render: (p) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-red)' }}>{p.code}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      render: (p) => p.department?.name || '—',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (p) => (
        <Button size="sm" variant="ghost" leftIcon={<Edit size={14} />} onClick={() => openEdit(p)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Briefcase size={22} color="var(--primary-red)" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Job Positions</h1>
        </div>
        <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={openCreate}>
          Add Position
        </Button>
      </div>

      <DataTable columns={columns} data={positions} isLoading={isLoading} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPos ? 'Edit Position' : 'Create Job Position'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Position Title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Position Code" required value={code} onChange={(e) => setCode(e.target.value)} />
          <Select
            label="Department"
            placeholder="Select Department"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
          />
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

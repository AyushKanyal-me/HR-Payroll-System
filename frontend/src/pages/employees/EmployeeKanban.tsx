import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeesApi, departmentsApi } from '../../api/endpoints';
import { Employee, Department } from '../../types';
import { getInitials } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmployeeFormModal } from './EmployeeFormModal';
import { Users, LayoutGrid, ListFilter, Plus, Search, Mail, Building2, Phone } from 'lucide-react';

export const EmployeeKanban: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        employeesApi.getAll({
          search: search || undefined,
          department_id: selectedDept || undefined,
          status: selectedStatus || undefined,
        }),
        departmentsApi.getAll(),
      ]);
      if (empRes.success && empRes.data) setEmployees(empRes.data);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDept, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="var(--primary-red)" />
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Employee Directory</h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {employees.length} personnel registered in organization
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button variant="outline" size="sm" onClick={() => navigate('/employees/list')}>
            <ListFilter size={15} style={{ marginRight: '6px' }} /> Table View
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div
        className="card-luxury"
        style={{
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr auto',
          gap: '12px',
          alignItems: 'center',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex' }}>
          <Input
            placeholder="Search by name, email, code..."
            leftIcon={<Search size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <Select
          placeholder="All Departments"
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        />

        <Select
          placeholder="All Statuses"
          options={[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'INACTIVE', label: 'Inactive' },
            { value: 'TERMINATED', label: 'Terminated' },
          ]}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        />

        <Button variant="secondary" size="sm" onClick={loadData}>
          Filter
        </Button>
      </div>

      {/* Kanban Grid of Cards */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>Loading workforce cards...</div>
      ) : employees.length === 0 ? (
        <div className="card-luxury" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-dim)' }}>
          No employees found matching criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="card-luxury card-luxury-interactive"
              onClick={() => navigate('/employees/' + emp.id)}
              style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-red-subtle)',
                      border: '1.5px solid var(--primary-red)',
                      color: 'var(--primary-red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {getInitials(emp.first_name, emp.last_name)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>
                      {emp.first_name} {emp.last_name}
                    </h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {emp.job_position?.title || 'Team Member'}
                    </div>
                  </div>
                </div>
                <Badge status={emp.status} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78125rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building2 size={13} /> {emp.department?.name || 'Unassigned'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={13} /> {emp.work_email}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};

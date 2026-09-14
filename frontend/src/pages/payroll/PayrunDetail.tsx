import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { payrollApi, employeesApi } from '../../api/endpoints';
import { Payrun, PayrunEmployee, PayrollWarning, Employee } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { DataTable, Column } from '../../components/ui/DataTable';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import {
  Banknote,
  Play,
  CheckCheck,
  CreditCard,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Users,
  UserPlus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { DoodleGears } from '../../components/doodles/DoodleArt';

export const PayrunDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [payrun, setPayrun] = useState<Payrun | null>(null);
  const [employees, setEmployees] = useState<PayrunEmployee[]>([]);
  const [warnings, setWarnings] = useState<PayrollWarning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Employee Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [allCompanyEmployees, setAllCompanyEmployees] = useState<Employee[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [isAddingEmps, setIsAddingEmps] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'compute' | 'validate' | 'paid' | 'cancel' | 'remove_employee';
    title: string;
    message: string;
    targetEmployeeId?: string;
  }>({
    isOpen: false,
    action: 'compute',
    title: '',
    message: '',
  });

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const pRes = await payrollApi.getPayrunById(id);
      if (pRes.success && pRes.data) {
        setPayrun(pRes.data);
      }
      try {
        const [eRes, wRes] = await Promise.all([
          payrollApi.getPayrunEmployees(id),
          payrollApi.getPayrunWarnings(id),
        ]);
        if (eRes.success && eRes.data) setEmployees(eRes.data);
        if (wRes.success && wRes.data) setWarnings(wRes.data);
      } catch {
        // secondary metadata failure should not block payrun rendering
      }
    } catch (err: any) {
      toast.error('Failed to Load Payrun', err.message || 'Unable to fetch payrun details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSyncAll = async () => {
    if (!id) return;
    setIsSyncing(true);
    try {
      await payrollApi.syncAllEmployees(id);
      toast.success('Workforce Synchronized', 'All active employees have been included in this payrun.');
      await loadData();
    } catch (err: any) {
      toast.error('Sync Failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenAddModal = async () => {
    try {
      const res = await employeesApi.getAll({ status: 'ACTIVE' });
      if (res.success && res.data) {
        // Filter out employees already in batch
        const existingIds = new Set(employees.map((e) => e.employee_id));
        setAllCompanyEmployees(res.data.filter((e) => !existingIds.has(e.id)));
      }
      setSelectedEmpIds([]);
      setIsAddModalOpen(true);
    } catch (err: any) {
      toast.error('Failed to load active employees', err.message);
    }
  };

  const handleAddSelectedEmployees = async () => {
    if (!id || selectedEmpIds.length === 0) return;
    setIsAddingEmps(true);
    try {
      await payrollApi.addEmployees(id, selectedEmpIds);
      toast.success('Employees Added', `${selectedEmpIds.length} employee(s) added to payrun batch.`);
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error('Failed to Add Employees', err.message);
    } finally {
      setIsAddingEmps(false);
    }
  };

  const handleRemoveEmployee = async (empId: string) => {
    if (!id) return;
    try {
      await payrollApi.removeEmployee(id, empId);
      toast.success('Employee Removed', 'Employee excluded from this payrun.');
      await loadData();
    } catch (err: any) {
      toast.error('Failed to Remove Employee', err.message);
    }
  };

  const handleAction = async () => {
    if (!id) return;
    setIsProcessing(true);
    try {
      if (confirmModal.action === 'compute') {
        await payrollApi.compute(id);
        toast.success('Payroll Computed', 'Calculations completed deterministically.');
      } else if (confirmModal.action === 'validate') {
        await payrollApi.validate(id);
        toast.success('Payroll Validated', 'Payslips generated and locked.');
      } else if (confirmModal.action === 'paid') {
        await payrollApi.markAsPaid(id);
        toast.success('Marked as Paid', 'Disbursement marked as complete.');
      } else if (confirmModal.action === 'cancel') {
        await payrollApi.cancel(id);
        toast.success('Payrun Cancelled', 'Batch cancelled.');
      } else if (confirmModal.action === 'remove_employee' && confirmModal.targetEmployeeId) {
        await handleRemoveEmployee(confirmModal.targetEmployeeId);
      }
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      loadData();
    } catch (err: any) {
      toast.error('Action Failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isDraftOrComputed = payrun?.status === 'DRAFT' || payrun?.status === 'COMPUTED';

  const employeeColumns: Column<PayrunEmployee>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (e) => (
        <span style={{ fontWeight: 600 }}>
          {e.employee ? e.employee.first_name + ' ' + e.employee.last_name : '—'}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Work Email',
      render: (e) => <span style={{ color: 'var(--text-muted)' }}>{e.employee?.work_email}</span>,
    },
    {
      key: 'bank',
      header: 'Bank Account',
      render: (e) =>
        e.employee?.bank_account_number ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{e.employee.bank_account_number}</span>
        ) : (
          <span style={{ color: 'var(--status-danger)', fontSize: '0.75rem', fontWeight: 600 }}>Missing Bank Details</span>
        ),
    },
    {
      key: 'status',
      header: 'Slip Status',
      render: (e) => <Badge status={e.status} />,
    },
    ...(isDraftOrComputed
      ? [
          {
            key: 'actions',
            header: 'Action',
            render: (e: PayrunEmployee) => (
              <Button
                variant="ghost"
                size="sm"
                title="Remove from batch"
                onClick={(event) => {
                  event.stopPropagation();
                  setConfirmModal({
                    isOpen: true,
                    action: 'remove_employee',
                    targetEmployeeId: e.employee_id,
                    title: 'Remove Employee from Batch',
                    message: `Exclude ${e.employee?.first_name || 'this employee'} from this payroll batch?`,
                  });
                }}
                style={{ color: 'var(--status-danger)', padding: '4px 8px' }}
              >
                <Trash2 size={15} />
              </Button>
            ),
          },
        ]
      : []),
  ];

  if (isLoading) {
    return <div style={{ padding: '40px', color: 'var(--text-dim)', textAlign: 'center' }}>Loading payrun engine...</div>;
  }

  if (!payrun) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <p style={{ color: 'var(--text-muted)' }}>Payrun batch not found or could not be loaded.</p>
        <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/payroll')}>
          Back to Payruns
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/payroll')}>
          Back to Payruns
        </Button>

        {/* Workflow Action Triggers */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {payrun.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Play size={16} />}
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  action: 'compute',
                  title: 'Compute Payrun',
                  message: 'Execute deterministic payroll engine for all eligible employees in this period?',
                })
              }
            >
              Compute Payroll
            </Button>
          )}

          {payrun.status === 'COMPUTED' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Play size={16} />}
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    action: 'compute',
                    title: 'Re-Compute Payrun',
                    message: 'Re-run calculations and update salary line items?',
                  })
                }
              >
                Recompute
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<CheckCheck size={16} />}
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    action: 'validate',
                    title: 'Validate Payrun',
                    message: 'Lock calculations and generate definitive payslip snapshots for all employees?',
                  })
                }
              >
                Validate & Lock
              </Button>
            </>
          )}

          {payrun.status === 'VALIDATED' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CreditCard size={16} />}
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  action: 'paid',
                  title: 'Mark as Paid',
                  message: 'Record bank disbursement completion for this payroll cycle?',
                })
              }
            >
              Mark as Paid
            </Button>
          )}

          {payrun.status !== 'PAID' && payrun.status !== 'CANCELLED' && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<XCircle size={16} />}
              onClick={() =>
                setConfirmModal({
                  isOpen: true,
                  action: 'cancel',
                  title: 'Cancel Payrun',
                  message: 'Are you sure you want to cancel this payrun batch?',
                })
              }
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Payrun Overview Card */}
      <div
        className="card-luxury"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Golden Gears Doodle Watermark */}
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-25px',
            pointerEvents: 'none',
            opacity: 0.35,
          }}
        >
          <DoodleGears size={210} color="#d4af37" opacity={0.85} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Period: {formatDate(payrun.period_start)} – {formatDate(payrun.period_end)}
            </span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {payrun.name}
            </h1>
          </div>
          <Badge status={payrun.status} size="md" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Gross Salary</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {formatCurrency(payrun.total_gross)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Deductions</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-danger)', marginTop: '2px' }}>
              -{formatCurrency(payrun.total_deductions)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Net Disbursement</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-red)', marginTop: '2px' }}>
              {formatCurrency(payrun.total_net)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Workforce Size</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
              {payrun.total_employees} Employees
            </div>
          </div>
        </div>
      </div>

      {/* Calculation Warnings Panel */}
      {warnings.length > 0 && (
        <div className="card-luxury" style={{ padding: '20px', borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color="var(--status-warning)" />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Calculation Warnings ({warnings.length})</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {warnings.map((w) => (
              <div key={w.id} style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>• {w.message}</span>
                <Badge variant={w.severity === 'ERROR' ? 'red' : 'amber'}>{w.severity}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Employees Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
            Included Employees ({employees.length})
          </h3>
          {isDraftOrComputed && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={15} />}
                isLoading={isSyncing}
                onClick={handleSyncAll}
              >
                Sync All Active
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserPlus size={15} />}
                onClick={handleOpenAddModal}
              >
                Add Employees
              </Button>
            </div>
          )}
        </div>

        {employees.length === 0 ? (
          <div
            className="card-luxury"
            style={{
              padding: '40px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Users size={36} color="var(--text-dim)" />
            <p style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '1rem' }}>No employees currently attached to this batch</p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', maxWidth: '440px' }}>
              Click below to sync all active company personnel or select specific employees to include in this payrun calculation.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RefreshCw size={16} />}
                isLoading={isSyncing}
                onClick={handleSyncAll}
              >
                Sync All Active Employees
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<UserPlus size={16} />}
                onClick={handleOpenAddModal}
              >
                Select Employees
              </Button>
            </div>
          </div>
        ) : (
          <DataTable columns={employeeColumns} data={employees} />
        )}
      </div>

      {/* Add Employees Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Employees to Payrun Batch"
        subtitle="Select active workforce members to include in this payroll period"
        maxWidth="600px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {allCompanyEmployees.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              All available active employees are already attached to this payrun.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>
                  {allCompanyEmployees.length} available employees
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedEmpIds.length === allCompanyEmployees.length) {
                      setSelectedEmpIds([]);
                    } else {
                      setSelectedEmpIds(allCompanyEmployees.map((e) => e.id));
                    }
                  }}
                  style={{ fontSize: '0.75rem' }}
                >
                  {selectedEmpIds.length === allCompanyEmployees.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div
                style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {allCompanyEmployees.map((emp) => {
                  const isChecked = selectedEmpIds.includes(emp.id);
                  return (
                    <label
                      key={emp.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: isChecked ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmpIds([...selectedEmpIds, emp.id]);
                          } else {
                            setSelectedEmpIds(selectedEmpIds.filter((x) => x !== emp.id));
                          }
                        }}
                        style={{ accentColor: 'var(--primary-red)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f4f4f5' }}>
                          {emp.first_name} {emp.last_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {emp.work_email} • {emp.department?.name || 'General'}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  isLoading={isAddingEmps}
                  disabled={selectedEmpIds.length === 0}
                  onClick={handleAddSelectedEmployees}
                >
                  Add Selected ({selectedEmpIds.length})
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleAction}
        title={confirmModal.title}
        message={confirmModal.message}
        isLoading={isProcessing}
        isDestructive={confirmModal.action === 'cancel' || confirmModal.action === 'remove_employee'}
      />
    </div>
  );
};

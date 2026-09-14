import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { contractsApi } from '../../api/endpoints';
import { Contract } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { ContractFormModal } from './ContractFormModal';
import { FileSignature, Edit, XCircle, ArrowLeft, Building2, Briefcase, Calendar } from 'lucide-react';

export const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await contractsApi.getById(id);
      if (res.success && res.data) setContract(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCloseContract = async () => {
    if (!id) return;
    setIsClosing(true);
    try {
      await contractsApi.close(id);
      toast.success('Contract Terminated', 'Status updated to TERMINATED.');
      setIsCloseDialogOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Action Failed', err.message);
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading || !contract) {
    return <div style={{ padding: '40px', color: 'var(--text-dim)', textAlign: 'center' }}>Loading contract...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/contracts')}>
          Back to Contracts
        </Button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" size="sm" leftIcon={<Edit size={16} />} onClick={() => setIsEditOpen(true)}>
            Edit Contract
          </Button>
          {contract.status === 'ACTIVE' && (
            <Button variant="danger" size="sm" leftIcon={<XCircle size={16} />} onClick={() => setIsCloseDialogOpen(true)}>
              Close Contract
            </Button>
          )}
        </div>
      </div>

      <div className="card-luxury" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Contract ID: {contract.id}</span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
              {contract.employee ? contract.employee.first_name + ' ' + contract.employee.last_name : 'Employee Contract'}
            </h1>
          </div>
          <Badge status={contract.status} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Monthly Wage</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-red)', marginTop: '2px' }}>
              {formatCurrency(contract.wage, contract.currency)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Salary Structure</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
              {contract.salary_structure?.name || 'Default Structure'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Period</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginTop: '2px' }}>
              {formatDate(contract.start_date)} – {contract.end_date ? formatDate(contract.end_date) : 'Ongoing'}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Working Schedule</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginTop: '2px' }}>
              {contract.schedule?.name || 'Standard 40h/week'}
            </div>
          </div>
        </div>
      </div>

      <ContractFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={loadData}
        contract={contract}
      />

      <ConfirmDialog
        isOpen={isCloseDialogOpen}
        onClose={() => setIsCloseDialogOpen(false)}
        onConfirm={handleCloseContract}
        title="Terminate Contract"
        message="Are you sure you want to close and terminate this employment contract? This will take effect immediately in payroll computations."
        isLoading={isClosing}
      />
    </div>
  );
};

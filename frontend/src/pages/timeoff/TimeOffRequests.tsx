import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { timeOffApi } from '../../api/endpoints';
import { TimeOffRequest } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../utils/formatters';
import { CalendarDays, Check, X } from 'lucide-react';

export const TimeOffRequests: React.FC = () => {
  const [searchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employee_id');
  const toast = useToast();

  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refuseModalReq, setRefuseModalReq] = useState<TimeOffRequest | null>(null);
  const [refuseReason, setRefuseReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await timeOffApi.getRequests({
        employee_id: employeeIdParam || undefined,
      });
      if (res.success && res.data) setRequests(res.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [employeeIdParam]);

  const handleApprove = async (req: TimeOffRequest) => {
    setIsProcessing(true);
    try {
      await timeOffApi.approveRequest(req.id);
      toast.success('Request Approved', 'Leave balance updated.');
      loadData();
    } catch (err: any) {
      toast.error('Approval Failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefuse = async () => {
    if (!refuseModalReq || !refuseReason) return;
    setIsProcessing(true);
    try {
      await timeOffApi.refuseRequest(refuseModalReq.id, refuseReason);
      toast.success('Request Refused', 'Notification dispatched.');
      setRefuseModalReq(null);
      setRefuseReason('');
      loadData();
    } catch (err: any) {
      toast.error('Refusal Failed', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const columns: Column<TimeOffRequest>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (r) => (
        <span style={{ fontWeight: 600 }}>
          {r.employee ? r.employee.first_name + ' ' + r.employee.last_name : '—'}
        </span>
      ),
    },
    {
      key: 'time_off_type',
      header: 'Leave Type',
      render: (r) => r.time_off_type?.name || 'Leave',
    },
    {
      key: 'dates',
      header: 'Duration',
      render: (r) => (
        <div>
          <span style={{ fontWeight: 500 }}>{formatDate(r.start_date)} – {formatDate(r.end_date)}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: '6px' }}>
            ({r.duration} {r.time_off_type?.unit.toLowerCase() || 'days'})
          </span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (r) => <span style={{ color: 'var(--text-muted)' }}>{r.reason || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Review',
      render: (r) =>
        r.status === 'PENDING' ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button size="sm" variant="secondary" leftIcon={<Check size={14} color="#10b981" />} onClick={() => handleApprove(r)}>
              Approve
            </Button>
            <Button size="sm" variant="danger" leftIcon={<X size={14} />} onClick={() => setRefuseModalReq(r)}>
              Refuse
            </Button>
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Processed</span>
        ),
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CalendarDays size={22} color="var(--primary-red)" />
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Time-Off Requests Pipeline</h1>
      </div>

      <DataTable columns={columns} data={requests} isLoading={isLoading} />

      <Modal
        isOpen={Boolean(refuseModalReq)}
        onClose={() => setRefuseModalReq(null)}
        title="Refuse Leave Request"
        subtitle="Provide feedback reason for the employee"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Refusal Reason"
            required
            placeholder="e.g. Critical sprint deadline during requested period"
            value={refuseReason}
            onChange={(e) => setRefuseReason(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" onClick={() => setRefuseModalReq(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={isProcessing} onClick={handleRefuse}>
              Confirm Refusal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { timeOffApi } from '../../api/endpoints';
import { TimeOffRequest, TimeOffType } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatDate } from '../../utils/formatters';
import { CalendarDays, Plus } from 'lucide-react';

export const MyTimeOff: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    time_off_type_id: '',
    start_date: '',
    end_date: '',
    duration: 1,
    reason: '',
  });

  const loadData = async () => {
    if (!user?.employeeId) {
      setIsLoading(false);
      return;
    }
    try {
      const [reqRes, typesRes] = await Promise.all([
        timeOffApi.getRequests({ employee_id: user.employeeId }),
        timeOffApi.getTypes(),
      ]);
      if (reqRes.success && reqRes.data) setRequests(reqRes.data);
      if (typesRes.success && typesRes.data) setTypes(typesRes.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.employeeId]);

  const calculateDuration = (start: string, end: string): number => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 1;
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const handleStartDateChange = (val: string) => {
    const newEndDate = form.end_date && form.end_date < val ? val : form.end_date || val;
    const dur = calculateDuration(val, newEndDate);
    setForm((prev) => ({ ...prev, start_date: val, end_date: newEndDate, duration: dur }));
  };

  const handleEndDateChange = (val: string) => {
    const newStartDate = form.start_date && form.start_date > val ? val : form.start_date || val;
    const dur = calculateDuration(newStartDate, val);
    setForm((prev) => ({ ...prev, start_date: newStartDate, end_date: val, duration: dur }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.employeeId) return;
    setIsSubmitting(true);
    try {
      await timeOffApi.createRequest({
        employee_id: user.employeeId,
        time_off_type_id: form.time_off_type_id,
        start_date: form.start_date,
        end_date: form.end_date,
        duration: form.duration,
        reason: form.reason || undefined,
      });
      toast.success('Time Off Requested', 'Your request has been submitted for approval.');
      setIsModalOpen(false);
      setForm({ time_off_type_id: '', start_date: '', end_date: '', duration: 1, reason: '' });
      loadData();
    } catch (err: any) {
      toast.error('Submission Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<TimeOffRequest>[] = [
    {
      key: 'leave_type',
      header: 'Leave Type',
      render: (r) => (
        <span style={{ fontWeight: 600 }}>{r.time_off_type?.name || 'Leave'}</span>
      ),
    },
    {
      key: 'start_date',
      header: 'Start Date',
      render: (r) => formatDate(r.start_date),
    },
    {
      key: 'end_date',
      header: 'End Date',
      render: (r) => formatDate(r.end_date),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (r) => `${r.duration} ${r.time_off_type?.unit.toLowerCase() || 'days'}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge status={r.status} />,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarDays size={22} color="var(--primary-red)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>My Time Off Requests</h2>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
          Request Leave
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
        emptyTitle="No leave requests found"
        emptyMessage="Submit a new request when you need time off."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Time Off"
        subtitle="Submit a request for management approval"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Leave Type"
            required
            placeholder="Select Leave Type"
            options={types.map((t) => ({ value: t.id, label: t.name + ' (' + t.unit + ')' }))}
            value={form.time_off_type_id}
            onChange={(e) => setForm({ ...form, time_off_type_id: e.target.value })}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Start Date"
              type="date"
              required
              value={form.start_date}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={form.end_date}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>
          <Input
            label="Duration (Days/Hours)"
            type="number"
            min="0.5"
            step="0.5"
            required
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: parseFloat(e.target.value) || 1 })}
          />
          <Input
            label="Reason / Note (Optional)"
            placeholder="Reason for time off..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

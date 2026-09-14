import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { attendanceApi } from '../../api/endpoints';
import { AttendanceRecord } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  record: AttendanceRecord | null;
}

export const AttendanceCorrectionModal: React.FC<AttendanceCorrectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  record,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [attendanceDate, setAttendanceDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState('PRESENT');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (record) {
      const d = record.attendance_date ? record.attendance_date.split('T')[0] : '';
      setAttendanceDate(d);
      setCheckInTime(record.check_in ? record.check_in.substring(11, 16) : '');
      setCheckOutTime(record.check_out ? record.check_out.substring(11, 16) : '');
      setStatus(record.status || 'PRESENT');
      setNote(record.correction_note || '');
    }
  }, [record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    setIsSubmitting(true);

    try {
      const dateStr = attendanceDate || record.attendance_date.split('T')[0];
      
      let newCheckIn: string | null = null;
      let newCheckOut: string | null = null;

      if (status !== 'ABSENT') {
        if (checkInTime) {
          newCheckIn = new Date(`${dateStr}T${checkInTime}:00`).toISOString();
        }
        if (checkOutTime) {
          newCheckOut = new Date(`${dateStr}T${checkOutTime}:00`).toISOString();
        }
      }

      await attendanceApi.update(record.id, {
        attendance_date: dateStr,
        check_in: newCheckIn,
        check_out: newCheckOut,
        status,
        correction_note: note || 'Manual correction by HR Manager',
        is_manual_edit: true,
      });

      toast.success('Attendance Corrected', 'Attendance record and audit trail updated successfully.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Correction Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAbsent = status === 'ABSENT';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Attendance Correction"
      subtitle={record?.employee ? record.employee.first_name + ' ' + record.employee.last_name : 'Employee record'}
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Attendance Date"
          type="date"
          required
          value={attendanceDate}
          onChange={(e) => setAttendanceDate(e.target.value)}
        />

        <Select
          label="Status Override"
          options={[
            { value: 'PRESENT', label: 'Present' },
            { value: 'ABSENT', label: 'Absent' },
            { value: 'LATE', label: 'Late' },
            { value: 'OVERTIME', label: 'Overtime' },
            { value: 'MISSING_CHECKOUT', label: 'Missing Check-Out' },
          ]}
          value={status}
          onChange={(e) => {
            const newStatus = e.target.value;
            setStatus(newStatus);
            if (newStatus === 'ABSENT') {
              setCheckInTime('');
              setCheckOutTime('');
            }
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input
            label="Check-In Time"
            type="time"
            disabled={isAbsent}
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
          />
          <Input
            label="Check-Out Time"
            type="time"
            disabled={isAbsent}
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
          />
        </div>

        <Input
          label="Reason / Correction Note (Mandatory for Audit)"
          required
          placeholder="e.g. Biometric reader missed scan or adjusted for false record"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Apply Correction
          </Button>
        </div>
      </form>
    </Modal>
  );
};

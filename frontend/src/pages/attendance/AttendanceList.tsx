import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { attendanceApi, employeesApi } from '../../api/endpoints';
import { AttendanceRecord, Employee } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { formatDate, formatHours } from '../../utils/formatters';
import { AttendanceCorrectionModal } from './AttendanceCorrectionModal';
import { Modal } from '../../components/ui/Modal';
import { Clock, Edit, ListOrdered } from 'lucide-react';

export const AttendanceList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const employeeIdParam = searchParams.get('employee_id');

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEmp, setSelectedEmp] = useState(employeeIdParam || '');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<AttendanceRecord | null>(null);
  const [selectedRecordForSessions, setSelectedRecordForSessions] = useState<AttendanceRecord | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        attendanceApi.getAll({
          employee_id: selectedEmp || undefined,
          status: selectedStatus || undefined,
        }),
        employeesApi.getAll(),
      ]);
      if (attRes.success && attRes.data) setRecords(attRes.data);
      if (empRes.success && empRes.data) setEmployees(empRes.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedEmp, selectedStatus]);

  const columns: Column<AttendanceRecord>[] = [
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
      key: 'attendance_date',
      header: 'Date',
      render: (r) => formatDate(r.attendance_date),
    },
    {
      key: 'check_in',
      header: 'Check In',
      render: (r) => {
        const inTime = r.sessions && r.sessions.length > 0 ? r.sessions[0].check_in : r.check_in;
        return inTime ? new Date(inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
      },
    },
    {
      key: 'check_out',
      header: 'Check Out',
      render: (r) => (r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'),
    },
    {
      key: 'worked_hours',
      header: 'Worked Hours',
      render: (r) => formatHours(r.worked_hours),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Badge status={r.status} />
          {r.is_manual_edit && (
            <span title={r.correction_note || 'Manual Correction'} style={{ fontSize: '0.6875rem', color: '#f59e0b', cursor: 'help' }}>
              (edited)
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<ListOrdered size={13} />}
            onClick={() => setSelectedRecordForSessions(r)}
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            {r.sessions && r.sessions.length > 1 ? `${r.sessions.length} Intervals` : 'Sessions'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Edit size={13} />}
            onClick={() => setSelectedRecordForEdit(r)}
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            Adjust
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={22} color="var(--primary-red)" />
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Workforce Attendance</h1>
        </div>
      </div>

      {/* Filter Row */}
      <div className="card-luxury" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
        <Select
          placeholder="All Personnel"
          options={employees.map((e) => ({ value: e.id, label: e.first_name + ' ' + e.last_name }))}
          value={selectedEmp}
          onChange={(e) => setSelectedEmp(e.target.value)}
        />
        <Select
          placeholder="All Statuses"
          options={[
            { value: 'PRESENT', label: 'Present' },
            { value: 'LATE', label: 'Late' },
            { value: 'OVERTIME', label: 'Overtime' },
            { value: 'ABSENT', label: 'Absent' },
            { value: 'MISSING_CHECKOUT', label: 'Missing Checkout' },
          ]}
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        />
        <Button variant="secondary" size="sm" onClick={loadData}>
          Refresh
        </Button>
      </div>

      <DataTable columns={columns} data={records} isLoading={isLoading} />

      {/* Punch Intervals Breakdown Modal */}
      {selectedRecordForSessions && (
        <Modal
          isOpen={!!selectedRecordForSessions}
          onClose={() => setSelectedRecordForSessions(null)}
          title="Daily Punch Intervals Breakdown"
          subtitle={`Attendance timeline for ${
            selectedRecordForSessions.employee
              ? `${selectedRecordForSessions.employee.first_name} ${selectedRecordForSessions.employee.last_name}`
              : 'Employee'
          } on ${formatDate(selectedRecordForSessions.attendance_date)}`}
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                padding: '14px',
                backgroundColor: '#141416',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Date</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f4f4f5', marginTop: '2px' }}>
                  {formatDate(selectedRecordForSessions.attendance_date)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Hours</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-red)', marginTop: '2px' }}>
                  {formatHours(selectedRecordForSessions.worked_hours)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Day Status</div>
                <div style={{ marginTop: '2px' }}>
                  <Badge status={selectedRecordForSessions.status} size="sm" />
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Recorded Work Intervals ({selectedRecordForSessions.sessions?.length || 1})
              </div>

              <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#18181b', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                      <th style={{ padding: '10px 12px' }}>#</th>
                      <th style={{ padding: '10px 12px' }}>Check In</th>
                      <th style={{ padding: '10px 12px' }}>Check Out</th>
                      <th style={{ padding: '10px 12px' }}>Duration</th>
                      <th style={{ padding: '10px 12px' }}>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedRecordForSessions.sessions && selectedRecordForSessions.sessions.length > 0
                      ? selectedRecordForSessions.sessions
                      : [
                          {
                            check_in: selectedRecordForSessions.check_in || '',
                            check_out: selectedRecordForSessions.check_out,
                            duration_minutes: selectedRecordForSessions.worked_hours ? selectedRecordForSessions.worked_hours * 60 : 0,
                            duration_hours: selectedRecordForSessions.worked_hours || 0,
                          },
                        ]
                    ).map((sess, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--primary-red)' }}>Interval {idx + 1}</td>
                        <td style={{ padding: '10px 12px', color: '#f4f4f5' }}>
                          {sess.check_in ? new Date(sess.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#f4f4f5' }}>
                          {sess.check_out ? new Date(sess.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress...'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-main)' }}>
                          {sess.duration_hours ? `${sess.duration_hours} hrs` : sess.check_out ? '0.0 hrs' : 'Active'}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '0.75rem', color: sess.check_out ? 'var(--status-success)' : 'var(--status-warning)', fontWeight: 600 }}>
                            {sess.check_out ? 'Completed' : 'Running'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setSelectedRecordForSessions(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <AttendanceCorrectionModal
        isOpen={Boolean(selectedRecordForEdit)}
        onClose={() => setSelectedRecordForEdit(null)}
        onSuccess={loadData}
        record={selectedRecordForEdit}
      />
    </div>
  );
};

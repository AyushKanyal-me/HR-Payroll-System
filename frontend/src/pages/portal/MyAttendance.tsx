import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi } from '../../api/endpoints';
import { AttendanceRecord, PunchSession } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatDate, formatHours } from '../../utils/formatters';
import { Clock, ListOrdered, Calendar } from 'lucide-react';

export const MyAttendance: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (user?.employeeId) {
      attendanceApi
        .getAll({ employee_id: user.employeeId })
        .then((res) => {
          if (res.success && res.data) setRecords(res.data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user?.employeeId]);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'attendance_date',
      header: 'Date',
      render: (r) => <span style={{ fontWeight: 600 }}>{formatDate(r.attendance_date)}</span>,
    },
    {
      key: 'check_in',
      header: 'First In',
      render: (r) => {
        const inTime = r.sessions && r.sessions.length > 0 ? r.sessions[0].check_in : r.check_in;
        return inTime ? new Date(inTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
      },
    },
    {
      key: 'check_out',
      header: 'Last Out',
      render: (r) => (r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'),
    },
    {
      key: 'worked_hours',
      header: 'Total Worked',
      render: (r) => <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{formatHours(r.worked_hours)}</span>,
    },
    {
      key: 'overtime_hours',
      header: 'Overtime',
      render: (r) => (r.overtime_hours > 0 ? <span style={{ color: '#a78bfa', fontWeight: 600 }}>+{r.overtime_hours} hrs</span> : '0 hrs'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: 'sessions_count',
      header: 'Punch Breakdown',
      render: (r) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<ListOrdered size={14} />}
          onClick={() => setSelectedRecordForDetail(r)}
          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
        >
          {r.sessions && r.sessions.length > 1 ? `${r.sessions.length} Intervals` : 'View Sessions'}
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Clock size={22} color="var(--primary-red)" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>My Attendance History</h2>
      </div>

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        emptyTitle="No attendance entries recorded"
        emptyMessage="Your daily check-ins and check-outs will appear here."
      />

      {/* Daily Punch Sessions Breakdown Modal */}
      {selectedRecordForDetail && (
        <Modal
          isOpen={!!selectedRecordForDetail}
          onClose={() => setSelectedRecordForDetail(null)}
          title="Daily Punch Intervals Breakdown"
          subtitle={`Attendance timeline for ${formatDate(selectedRecordForDetail.attendance_date)}`}
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Daily summary header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '14px', backgroundColor: '#141416', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Date</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f4f4f5', marginTop: '2px' }}>
                  {formatDate(selectedRecordForDetail.attendance_date)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Hours</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary-red)', marginTop: '2px' }}>
                  {formatHours(selectedRecordForDetail.worked_hours)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Day Status</div>
                <div style={{ marginTop: '2px' }}>
                  <Badge status={selectedRecordForDetail.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Sessions Table */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Recorded Work Intervals ({selectedRecordForDetail.sessions?.length || 1})
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
                    {(selectedRecordForDetail.sessions && selectedRecordForDetail.sessions.length > 0
                      ? selectedRecordForDetail.sessions
                      : [
                          {
                            check_in: selectedRecordForDetail.check_in || '',
                            check_out: selectedRecordForDetail.check_out,
                            duration_minutes: selectedRecordForDetail.worked_hours ? selectedRecordForDetail.worked_hours * 60 : 0,
                            duration_hours: selectedRecordForDetail.worked_hours || 0,
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
              <Button variant="outline" onClick={() => setSelectedRecordForDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

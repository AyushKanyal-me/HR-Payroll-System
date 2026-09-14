import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { attendanceApi } from '../../api/endpoints';
import { AttendanceQuickStatus } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Clock, LogIn, LogOut, CheckCircle2 } from 'lucide-react';


export const QuickCheckInCard: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState<AttendanceQuickStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadStatus = async () => {
    if (!user?.employeeId) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await attendanceApi.getQuickStatus(user.employeeId);
      if (res.success && res.data) {
        setStatus(res.data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [user?.employeeId]);

  const handlePunch = async () => {
    if (!user?.employeeId) return;
    setIsPunching(true);
    try {
      if (status?.is_checked_in && !status?.is_checked_out) {
        await attendanceApi.checkOut({ employee_id: user.employeeId });
        toast.success('Punched Out', 'Shift concluded successfully.');
      } else {
        await attendanceApi.checkIn({ employee_id: user.employeeId });
        toast.success('Punched In', 'Workday commenced.');
      }
      await loadStatus();
    } catch (err: any) {
      toast.error('Punch Failed', err.message);
    } finally {
      setIsPunching(false);
    }
  };

  const isWorking = status?.is_checked_in && !status?.is_checked_out;
  const isFinished = status?.is_checked_in && status?.is_checked_out;

  return (
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
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #dc2626, #991b1b)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--primary-red)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Work Shift & Punch</h3>
        </div>
        <Badge
          status={isWorking ? 'PRESENT' : isFinished ? 'COMPUTED' : 'DRAFT'}
        >
          {isWorking ? 'ACTIVE SHIFT' : isFinished ? 'SHIFT ENDED' : 'NOT PUNCHED'}
        </Badge>
      </div>

      {/* Clock display */}
      <div style={{ textAlign: 'center', padding: '16px 0', backgroundColor: '#161619', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '2.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.02em' }}>
          {currentTime.toLocaleTimeString()}
        </div>
        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Check In / Out Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div style={{ padding: '12px', backgroundColor: '#141416', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>First In</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: status?.check_in ? '#f4f4f5' : 'var(--text-dim)', marginTop: '2px' }}>
            {status?.sessions && status.sessions.length > 0
              ? new Date(status.sessions[0].check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : status?.check_in
              ? new Date(status.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </div>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#141416', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Last Out</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: status?.check_out ? '#f4f4f5' : 'var(--text-dim)', marginTop: '2px' }}>
            {status?.check_out ? new Date(status.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
          </div>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#141416', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Worked</div>
          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--primary-red)', marginTop: '2px' }}>
            {status?.worked_hours ? `${status.worked_hours} hrs` : isWorking ? `${(status?.elapsed_minutes ? (status.elapsed_minutes / 60).toFixed(1) : '0.1')} hrs` : '0.0 hrs'}
          </div>
        </div>
      </div>

      {/* Multi-punch sessions timeline */}
      {status?.sessions && status.sessions.length > 0 && (
        <div style={{ backgroundColor: '#121215', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Today's Punch Intervals ({status.sessions.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
            {status.sessions.map((sess, idx) => {
              const inTime = new Date(sess.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const outTime = sess.check_out
                ? new Date(sess.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'In Progress...';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.8125rem',
                    padding: '4px 8px',
                    backgroundColor: '#18181b',
                    borderRadius: '5px',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-red)', fontWeight: 700 }}>#{idx + 1}</span>
                    <span style={{ color: '#f4f4f5' }}>{inTime} – {outTime}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: sess.check_out ? 'var(--text-muted)' : 'var(--status-success)', fontWeight: 600 }}>
                    {sess.check_out ? `${sess.duration_hours || 0} hrs` : 'Active'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button
        variant={isWorking ? 'secondary' : 'primary'}
        size="lg"
        isLoading={isPunching || isLoading}
        leftIcon={isWorking ? <LogOut size={18} /> : <LogIn size={18} />}
        onClick={handlePunch}
        style={{ width: '100%' }}
      >
        {isWorking ? 'Punch Out & End Shift' : isFinished ? 'Punch In Again' : 'Punch In Now'}
      </Button>
    </div>
  );
};

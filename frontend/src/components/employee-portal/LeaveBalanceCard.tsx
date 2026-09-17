import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { timeOffApi } from '../../api/endpoints';
import { TimeOffAllocation } from '../../types';
import { CalendarDays } from 'lucide-react';

export const LeaveBalanceCard: React.FC = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.employeeId) {
      timeOffApi
        .getAllocations({ employee_id: user.employeeId, year: new Date().getFullYear() })
        .then((res) => {
          if (res.success && res.data) setAllocations(res.data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user?.employeeId]);

  return (
    <div className="card-luxury" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CalendarDays size={18} color="var(--primary-red)" />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-main)' }}>Leave Balances ({new Date().getFullYear()})</h3>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Loading balances...</div>
      ) : allocations.length === 0 ? (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>No active leave allocations for this year.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {allocations.map((alloc) => {
            const remaining = alloc.allocated_amount - alloc.used_amount;
            const percent = (alloc.used_amount / alloc.allocated_amount) * 100;

            return (
              <div key={alloc.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {alloc.time_off_type?.name || 'Leave'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {remaining} / {alloc.allocated_amount} {alloc.time_off_type?.unit.toLowerCase()} remaining
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: Math.min(percent, 100) + '%',
                      height: '100%',
                      backgroundColor: 'var(--primary-red)',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

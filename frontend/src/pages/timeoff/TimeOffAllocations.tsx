import React, { useState, useEffect } from 'react';
import { timeOffApi } from '../../api/endpoints';
import { TimeOffAllocation } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Sparkles } from 'lucide-react';

export const TimeOffAllocations: React.FC = () => {
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    timeOffApi
      .getAllocations({ year: new Date().getFullYear() })
      .then((res) => {
        if (res.success && res.data) setAllocations(res.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const columns: Column<TimeOffAllocation>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (a) => (
        <span style={{ fontWeight: 600 }}>
          {a.employee ? a.employee.first_name + ' ' + a.employee.last_name : '—'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Leave Type',
      render: (a) => a.time_off_type?.name || 'Leave',
    },
    {
      key: 'year',
      header: 'Fiscal Year',
      render: (a) => a.year,
    },
    {
      key: 'quota',
      header: 'Allocated',
      render: (a) => a.allocated_amount + ' ' + (a.time_off_type?.unit.toLowerCase() || 'days'),
    },
    {
      key: 'used',
      header: 'Used',
      render: (a) => a.used_amount + ' ' + (a.time_off_type?.unit.toLowerCase() || 'days'),
    },
    {
      key: 'remaining',
      header: 'Remaining Balance',
      render: (a) => {
        const rem = a.allocated_amount - a.used_amount;
        return <span style={{ fontWeight: 700, color: rem > 0 ? 'var(--status-success)' : 'var(--status-danger)' }}>{rem}</span>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <Badge status={a.status} />,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Sparkles size={22} color="var(--primary-red)" />
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Employee Leave Quotas ({new Date().getFullYear()})</h1>
      </div>

      <DataTable columns={columns} data={allocations} isLoading={isLoading} />
    </div>
  );
};

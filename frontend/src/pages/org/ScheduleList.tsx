import React, { useState, useEffect } from 'react';
import { schedulesApi } from '../../api/endpoints';
import { WorkingSchedule } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { CalendarRange } from 'lucide-react';

export const ScheduleList: React.FC = () => {
  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    schedulesApi
      .getAll()
      .then((res) => {
        if (res.success && res.data) setSchedules(res.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const columns: Column<WorkingSchedule>[] = [
    {
      key: 'name',
      header: 'Schedule Name',
      render: (s) => <span style={{ fontWeight: 600 }}>{s.name}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (s) => <Badge status={s.schedule_type} />,
    },
    {
      key: 'days_per_week',
      header: 'Work Days / Wk',
      render: (s) => s.days_per_week + ' days',
    },
    {
      key: 'hours_per_week',
      header: 'Weekly Hours',
      render: (s) => s.hours_per_week + ' hrs',
    },
    {
      key: 'timezone',
      header: 'Timezone',
      render: (s) => <span style={{ color: 'var(--text-muted)' }}>{s.timezone}</span>,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CalendarRange size={22} color="var(--primary-red)" />
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Working Schedules</h1>
      </div>

      <DataTable columns={columns} data={schedules} isLoading={isLoading} />
    </div>
  );
};

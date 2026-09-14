import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/endpoints';
import {
  DashboardKpis,
  DepartmentSalaryItem,
  SalaryTrendItem,
  AttendanceOverview,
  OperationalAlerts,
} from '../../types';
import { KpiCard } from '../../components/ui/KpiCard';
import { SalaryTrendChart, DepartmentWageChart } from '../../components/ui/Charts';
import { formatCurrency, formatHours, formatDate } from '../../utils/formatters';
import {
  Users,
  Banknote,
  Clock,
  AlertTriangle,
  FileSignature,
  CalendarDays,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { DoodleClock } from '../../components/doodles/DoodleArt';

export const Dashboard: React.FC = () => {
  const { isEmployeeOnly } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [deptSalaries, setDeptSalaries] = useState<DepartmentSalaryItem[]>([]);
  const [trends, setTrends] = useState<SalaryTrendItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceOverview | null>(null);
  const [alerts, setAlerts] = useState<OperationalAlerts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isEmployeeOnly) {
      navigate('/portal', { replace: true });
      return;
    }

    const loadData = async () => {
      try {
        const [kpiRes, deptRes, trendRes, attRes, alertRes] = await Promise.allSettled([
          dashboardApi.getKpis(),
          dashboardApi.getSalaryByDept(),
          dashboardApi.getSalaryTrends(6),
          dashboardApi.getAttendanceOverview(),
          dashboardApi.getAlerts(),
        ]);

        if (kpiRes.status === 'fulfilled' && kpiRes.value.success) setKpis(kpiRes.value.data);
        if (deptRes.status === 'fulfilled' && deptRes.value.success) setDeptSalaries(deptRes.value.data || []);
        if (trendRes.status === 'fulfilled' && trendRes.value.success) setTrends(trendRes.value.data || []);
        if (attRes.status === 'fulfilled' && attRes.value.success) setAttendance(attRes.value.data);
        if (alertRes.status === 'fulfilled' && alertRes.value.success) setAlerts(alertRes.value.data);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isEmployeeOnly, navigate]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f4f4f5' }}>
            Executive Dashboard
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Real-time workforce intelligence, payroll metrics & compliance alerts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="outline" onClick={() => navigate('/payroll')}>
            Run Payroll
          </Button>
          <Button variant="primary" onClick={() => navigate('/employees')}>
            Manage Directory
          </Button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <KpiCard
          title="Total Workforce"
          value={kpis?.headcount.active ?? '—'}
          subtitle={(kpis?.headcount.total ?? 0) + ' Total Registered'}
          icon={<Users size={20} />}
          accentColor="var(--primary-red)"
        />
        <KpiCard
          title="Net Salary Disbursed"
          value={formatCurrency(kpis?.payroll.totalNetSalaryPaid)}
          subtitle={(kpis?.payroll.payslipsGenerated ?? 0) + ' Payslips generated'}
          icon={<Banknote size={20} />}
          accentColor="#10b981"
        />
        <KpiCard
          title="Attendance Health"
          value={attendance ? (attendance.attendanceRate).toFixed(1) + '%' : '—'}
          subtitle={formatHours(attendance?.totalWorkedHours) + ' worked this month'}
          icon={<Clock size={20} />}
          accentColor="#3b82f6"
        />
        <KpiCard
          title="Pending Time Off"
          value={kpis?.timeOffHealth.pendingRequests ?? '—'}
          subtitle={(kpis?.timeOffHealth.approvedRequests ?? 0) + ' approved requests'}
          icon={<CalendarDays size={20} />}
          accentColor="#f59e0b"
        />
      </div>

      {/* 2-Column Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Salary Trends Area */}
        <div className="card-luxury" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Salary Disbursement Trends</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Last 6 Months</span>
          </div>
          <SalaryTrendChart data={trends} />
        </div>

        {/* Department Salary Distribution */}
        <div className="card-luxury" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Wage by Department</h3>
          <DepartmentWageChart data={deptSalaries} />
        </div>
      </div>

      {/* Operational Compliance Alerts */}
      <div
        className="card-luxury"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Golden Clock Doodle Watermark */}
        <div
          style={{
            position: 'absolute',
            right: '-25px',
            bottom: '-35px',
            pointerEvents: 'none',
            opacity: 0.35,
          }}
        >
          <DoodleClock size={210} color="#d4af37" opacity={0.85} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--status-warning)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Operational & Compliance Alerts</h3>
          </div>
          <Badge variant="amber">
            {(alerts?.summary.totalAlerts ?? 0) + ' Action Items'}
          </Badge>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Expiring Contracts */}
          <div style={{ padding: '16px', backgroundColor: '#141416', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>Expiring Contracts</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--status-warning)', fontWeight: 700 }}>
                {alerts?.summary.expiringContractsCount ?? 0}
              </span>
            </div>
            {alerts?.alerts.expiringContracts && alerts.alerts.expiringContracts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alerts.alerts.expiringContracts.slice(0, 3).map((c) => (
                  <div key={c.contractId} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {c.employeeName} — in {c.daysRemaining} days
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No contracts expiring within 30 days.</div>
            )}
          </div>

          {/* Missing Bank Details */}
          <div style={{ padding: '16px', backgroundColor: '#141416', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>Missing Bank Info</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--status-danger)', fontWeight: 700 }}>
                {alerts?.summary.missingBankDetailsCount ?? 0}
              </span>
            </div>
            {alerts?.alerts.missingBankDetails && alerts.alerts.missingBankDetails.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alerts.alerts.missingBankDetails.slice(0, 3).map((e) => (
                  <div key={e.employeeId} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {e.firstName} {e.lastName} ({e.departmentName || 'No Dept'})
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>All active employees have bank accounts on file.</div>
            )}
          </div>

          {/* Unresolved Payroll Warnings */}
          <div style={{ padding: '16px', backgroundColor: '#141416', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)' }}>Payroll Warnings</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary-red)', fontWeight: 700 }}>
                {alerts?.summary.unresolvedWarningsCount ?? 0}
              </span>
            </div>
            {alerts?.alerts.unresolvedWarnings && alerts.alerts.unresolvedWarnings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {alerts.alerts.unresolvedWarnings.slice(0, 3).map((w) => (
                  <div key={w.warningId} style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {w.message}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Zero unresolved payroll calculation warnings.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

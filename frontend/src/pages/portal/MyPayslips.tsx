import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { payslipsApi } from '../../api/endpoints';
import { PayslipDetailed } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { openPdfInNewTab } from '../../utils/pdf';
import { Receipt, ExternalLink } from 'lucide-react';

export const MyPayslips: React.FC = () => {
  const { user, token } = useAuth();
  const [payslips, setPayslips] = useState<PayslipDetailed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.employeeId) {
      payslipsApi
        .getAll({ employee_id: user.employeeId })
        .then((res) => {
          if (res.success && res.data) setPayslips(res.data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user?.employeeId]);

  const columns: Column<PayslipDetailed>[] = [
    {
      key: 'period',
      header: 'Pay Period',
      render: (p) => (
        <span style={{ fontWeight: 600 }}>
          {formatDate(p.period_start)} – {formatDate(p.period_end)}
        </span>
      ),
    },
    {
      key: 'gross_salary',
      header: 'Gross Salary',
      render: (p) => formatCurrency(p.gross_salary),
    },
    {
      key: 'total_deductions',
      header: 'Deductions',
      render: (p) => <span style={{ color: 'var(--status-danger)' }}>-{formatCurrency(p.total_deductions)}</span>,
    },
    {
      key: 'net_salary',
      header: 'Net Salary',
      render: (p) => <span style={{ fontWeight: 700, color: 'var(--status-success)' }}>{formatCurrency(p.net_salary)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge status={p.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      render: (p) => (
        <Button
          size="sm"
          variant="outline"
          leftIcon={<ExternalLink size={14} />}
          onClick={() => openPdfInNewTab(payslipsApi.getPdfUrl(p.id), token)}
        >
          Open PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Receipt size={22} color="var(--primary-red)" />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>My Payslips Archive</h2>
      </div>

      <DataTable
        columns={columns}
        data={payslips}
        isLoading={isLoading}
        emptyTitle="No payslips available"
        emptyMessage="Generated payslips from validated payruns will appear here."
      />
    </div>
  );
};

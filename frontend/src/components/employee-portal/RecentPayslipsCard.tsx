import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { payslipsApi } from '../../api/endpoints';
import { PayslipDetailed } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { openPdfInNewTab } from '../../utils/pdf';
import { Receipt, ExternalLink, FileDown } from 'lucide-react';
import { Button } from '../ui/Button';

export const RecentPayslipsCard: React.FC = () => {
  const { user, token } = useAuth();
  const [payslips, setPayslips] = useState<PayslipDetailed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.employeeId) {
      payslipsApi
        .getAll({ employee_id: user.employeeId })
        .then((res) => {
          if (res.success && res.data) setPayslips(res.data.slice(0, 3));
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user?.employeeId]);

  return (
    <div className="card-luxury" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Receipt size={18} color="var(--primary-red)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Payslips</h3>
        </div>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>Loading payslips...</div>
      ) : payslips.length === 0 ? (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>No generated payslips found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {payslips.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#141416',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {formatDate(p.period_start)} – {formatDate(p.period_end)}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--primary-red)', fontWeight: 700, marginTop: '2px' }}>
                  {formatCurrency(p.net_salary)} Net
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<ExternalLink size={14} />}
                onClick={() => openPdfInNewTab(payslipsApi.getPdfUrl(p.id), token)}
              >
                Open PDF
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

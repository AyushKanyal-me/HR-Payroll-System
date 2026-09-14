import React from 'react';
import { SalaryTrendItem, DepartmentSalaryItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SalaryTrendChartProps {
  data: SalaryTrendItem[];
  height?: number;
}

export const SalaryTrendChart: React.FC<SalaryTrendChartProps> = ({ data, height = 240 }) => {
  if (!data || data.length === 0) {
    return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>No trend data available</div>;
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.totalGross, d.totalNet, 1000)));

  return (
    <div style={{ width: '100%', height, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '8px' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
        {data.map((item, idx) => {
          const grossPercent = (item.totalGross / maxVal) * 100;
          const netPercent = (item.totalNet / maxVal) * 100;

          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '100%' }}>
                {/* Gross bar */}
                <div
                  title={'Gross: ' + formatCurrency(item.totalGross)}
                  style={{
                    width: '14px',
                    height: Math.max(grossPercent, 4) + '%',
                    backgroundColor: 'rgba(220, 38, 38, 0.4)',
                    border: '1px solid var(--primary-red)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease',
                  }}
                />
                {/* Net bar */}
                <div
                  title={'Net: ' + formatCurrency(item.totalNet)}
                  style={{
                    width: '14px',
                    height: Math.max(netPercent, 4) + '%',
                    backgroundColor: 'var(--primary-red)',
                    borderRadius: '4px 4px 0 0',
                    boxShadow: '0 0 10px rgba(220, 38, 38, 0.5)',
                    transition: 'all 0.3s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                {item.period}
              </span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: 'rgba(220, 38, 38, 0.4)', border: '1px solid var(--primary-red)', borderRadius: '2px' }} />
          Gross Salary
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--primary-red)', borderRadius: '2px' }} />
          Net Paid
        </div>
      </div>
    </div>
  );
};

interface DepartmentWageChartProps {
  data: DepartmentSalaryItem[];
}

export const DepartmentWageChart: React.FC<DepartmentWageChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)' }}>No department salary records</div>;
  }

  const maxPaid = Math.max(...data.map((d) => Math.max(d.totalPaidNet, d.totalWage, 1000)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {data.map((d) => {
        const percent = Math.min((d.totalPaidNet / maxPaid) * 100, 100);
        return (
          <div key={d.departmentId} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{d.departmentName}</span>
              <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(d.totalPaidNet)}</span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#1c1c20', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: Math.max(percent, 4) + '%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #dc2626, #ef4444)',
                  borderRadius: '9999px',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from 'react';
import { SalaryTrendItem, DepartmentSalaryItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface SalaryTrendChartProps {
  data: SalaryTrendItem[];
  height?: number;
}

export const SalaryTrendChart: React.FC<SalaryTrendChartProps> = ({ data, height = 240 }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        No trend data available
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.totalGross, d.totalNet, 1000)));

  return (
    <div style={{ width: '100%', height, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '12px' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        {data.map((item, idx) => {
          const grossPercent = (item.totalGross / maxVal) * 100;
          const netPercent = (item.totalNet / maxVal) * 100;

          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '6px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '100%' }}>
                {/* Gross bar (single coral color, distinguished by 35% opacity + crisp border) */}
                <div
                  title={'Gross: ' + formatCurrency(item.totalGross)}
                  style={{
                    width: '16px',
                    height: Math.max(grossPercent, 4) + '%',
                    backgroundColor: 'rgba(245, 106, 106, 0.35)',
                    border: '1.5px solid var(--primary-red)',
                    borderRadius: '3px 3px 0 0',
                    transition: 'all 0.3s ease-in-out',
                  }}
                />
                {/* Net bar (single coral color, solid 100% fill) */}
                <div
                  title={'Net: ' + formatCurrency(item.totalNet)}
                  style={{
                    width: '16px',
                    height: Math.max(netPercent, 4) + '%',
                    backgroundColor: 'var(--primary-red)',
                    borderRadius: '3px 3px 0 0',
                    boxShadow: '0 2px 8px rgba(245, 106, 106, 0.25)',
                    transition: 'all 0.3s ease-in-out',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '4px' }}>
                {item.period}
              </span>
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '12px', height: '12px', backgroundColor: 'rgba(245, 106, 106, 0.35)', border: '1.5px solid var(--primary-red)', borderRadius: '2px' }} />
          Gross Salary
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '12px', height: '12px', backgroundColor: 'var(--primary-red)', borderRadius: '2px' }} />
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
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-sans)' }}>
        No department salary records
      </div>
    );
  }

  const maxPaid = Math.max(...data.map((d) => Math.max(d.totalPaidNet, d.totalWage, 1000)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {data.map((d, index) => {
        const percent = Math.min((d.totalPaidNet / maxPaid) * 100, 100);
        // Single color palette with distinct opacity variations based on item rank
        const opacity = Math.max(1 - (index * 0.12), 0.45);

        return (
          <div key={d.departmentId} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{d.departmentName}</span>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {formatCurrency(d.totalPaidNet)}
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: Math.max(percent, 4) + '%',
                  height: '100%',
                  backgroundColor: 'var(--primary-red)',
                  opacity: opacity,
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease-in-out',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

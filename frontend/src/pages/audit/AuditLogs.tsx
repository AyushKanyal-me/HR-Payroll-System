import React, { useState, useEffect } from 'react';
import { auditLogsApi } from '../../api/endpoints';
import { AuditLogEntry } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { formatDateTime } from '../../utils/formatters';
import { FileSearch, Eye, RefreshCw } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadData = () => {
    setIsLoading(true);
    auditLogsApi
      .getAll()
      .then((res) => {
        if (res.success && res.data) setLogs(res.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const getActionVariant = (action: string): 'red' | 'green' | 'blue' | 'amber' | 'default' => {
    if (action.includes('PAID') || action.includes('APPROVED')) return 'green';
    if (action.includes('VALIDATED') || action.includes('COMPUTED')) return 'blue';
    if (action.includes('CREATED') || action.includes('ONBOARDED')) return 'amber';
    if (action.includes('CANCELLED') || action.includes('REJECTED')) return 'red';
    return 'default';
  };

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (l) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78125rem' }}>{formatDateTime(l.created_at)}</span>,
    },
    {
      key: 'action',
      header: 'Action Event',
      render: (l) => <Badge variant={getActionVariant(l.action)}>{l.action}</Badge>,
    },
    {
      key: 'entity_type',
      header: 'Entity / Target',
      render: (l) => (
        <span style={{ fontWeight: 600, color: '#f4f4f5' }}>
          {l.entity_type} {l.entity_id ? `(#${l.entity_id.slice(0, 8)})` : ''}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Actor / User',
      render: (l) => (
        <span style={{ color: 'var(--text-muted)' }}>
          {l.user?.employee ? `${l.user.employee.first_name} ${l.user.employee.last_name}` : l.user?.auth_user_id ? 'Authenticated Admin' : 'System Engine'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Inspect',
      render: (l) => (
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<Eye size={14} />}
          onClick={() => setSelectedLog(l)}
          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileSearch size={22} color="var(--primary-red)" />
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>System Audit Trail</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              Immutable event history of payroll computations, attendance punches, approvals, and system state transitions
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={loadData}>
          Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyTitle="No audit log records found"
        emptyMessage="System events and lifecycle actions will automatically appear here as operations are performed."
      />

      {/* Audit Detail Modal */}
      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="Audit Log Event Details"
          subtitle={`Event ID #${selectedLog.id} — Recorded at ${formatDateTime(selectedLog.created_at)}`}
          maxWidth="600px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', backgroundColor: '#141416', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Action</div>
                <div style={{ marginTop: '4px' }}>
                  <Badge variant={getActionVariant(selectedLog.action)}>{selectedLog.action}</Badge>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Target Entity</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f4f4f5', marginTop: '4px' }}>
                  {selectedLog.entity_type} {selectedLog.entity_id ? `(${selectedLog.entity_id})` : ''}
                </div>
              </div>
            </div>

            {selectedLog.new_values && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Event Payload / New Values
                </div>
                <pre
                  style={{
                    backgroundColor: '#121214',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '0.8125rem',
                    color: '#a7f3d0',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.old_values && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Previous State / Old Values
                </div>
                <pre
                  style={{
                    backgroundColor: '#121214',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '0.8125rem',
                    color: '#fca5a5',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { salaryApi } from '../../api/endpoints';
import { SalaryStructure, SalaryRule } from '../../types';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Layers, Plus, Check } from 'lucide-react';
import { DoodleScale } from '../../components/doodles/DoodleArt';

export const SalaryStructures: React.FC = () => {
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [availableRules, setAvailableRules] = useState<SalaryRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        salaryApi.getStructures(),
        salaryApi.getRules(),
      ]);
      if (sRes.success && sRes.data) setStructures(sRes.data);
      if (rRes.success && rRes.data) {
        setAvailableRules(rRes.data);
        // By default select all rules
        setSelectedRuleIds(rRes.data.map((r) => r.id));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setName('');
    setCode('');
    setDescription('');
    setSelectedRuleIds(availableRules.map((r) => r.id));
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const rulesPayload = selectedRuleIds.map((ruleId, index) => ({
        salary_rule_id: ruleId,
        sequence: index + 1,
      }));

      await salaryApi.createStructure({
        name,
        code: code.toUpperCase().trim(),
        description,
        company_id: 'a0000000-0000-0000-0000-000000000001',
        is_active: true,
        rules: rulesPayload,
      });

      toast.success('Salary Structure Created', 'New salary calculation schema initialized.');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error('Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<SalaryStructure>[] = [
    {
      key: 'name',
      header: 'Structure Name',
      render: (s) => <span style={{ fontWeight: 600 }}>{s.name}</span>,
    },
    {
      key: 'code',
      header: 'Code',
      render: (s) => <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-red)', fontWeight: 600 }}>{s.code}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (s) => <span style={{ color: 'var(--text-muted)' }}>{s.description || 'Standard corporate structure'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <Badge status={s.is_active ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div
        className="card-luxury"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Golden Balance Scale Doodle Watermark */}
        <div
          style={{
            position: 'absolute',
            right: '160px',
            top: '-35px',
            pointerEvents: 'none',
            opacity: 0.35,
          }}
        >
          <DoodleScale size={180} color="#d4af37" opacity={0.85} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', zIndex: 1 }}>
          <Layers size={22} color="var(--primary-red)" />
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Salary Structures</h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Deterministic compensation rules and sequential calculation models
            </p>
          </div>
        </div>

        {isAdmin && (
          <Button variant="primary" size="sm" leftIcon={<Plus size={16} />} onClick={handleOpenCreateModal} style={{ zIndex: 1 }}>
            New Structure
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={structures} isLoading={isLoading} />

      {/* Admin Salary Structure Creation Modal */}
      {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Salary Structure"
          subtitle="Configure a deterministic salary calculation pipeline and sequence"
          maxWidth="560px"
        >
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Structure Name"
              required
              placeholder="e.g. Executive Compensation Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Structure Code"
              required
              placeholder="e.g. EXEC_MONTHLY"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <Input
              label="Description"
              placeholder="e.g. Standard monthly calculation with custom allowances"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Included Salary Rules ({selectedRuleIds.length} of {availableRules.length})
              </div>
              <div
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {availableRules.map((rule) => {
                  const isChecked = selectedRuleIds.includes(rule.id);
                  return (
                    <label
                      key={rule.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        backgroundColor: isChecked ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRuleIds([...selectedRuleIds, rule.id]);
                          } else {
                            setSelectedRuleIds(selectedRuleIds.filter((x) => x !== rule.id));
                          }
                        }}
                        style={{ accentColor: 'var(--primary-red)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f4f4f5' }}>
                          {rule.name} <span style={{ color: 'var(--primary-red)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>({rule.code})</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {rule.category} • {rule.calculation_type}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
              <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={!name || !code || selectedRuleIds.length === 0}>
                Create Structure
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

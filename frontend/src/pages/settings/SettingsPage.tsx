import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { companiesApi } from '../../api/endpoints';
import { Company } from '../../types';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Settings, Building2, Shield, Bell, Database } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    name: 'HR Pay 360 Global Corp',
    tax_id: 'PAN-AAACP1234K',
    registration_number: 'CIN-U72200MH2024PTC123456',
    currency: 'INR',
    address: '100 Business Boulevard, Suite 400',
    country: 'India',
  });

  useEffect(() => {
    companiesApi
      .getCurrent()
      .then((res) => {
        if (res.success && res.data) {
          setCompany(res.data);
          setForm({
            name: res.data.name || 'HR Pay 360 Global Corp',
            tax_id: res.data.tax_id || '',
            registration_number: res.data.registration_number || '',
            currency: res.data.currency || 'INR',
            address: res.data.address || '',
            country: res.data.country || 'India',
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (company?.id) {
        await companiesApi.update(company.id, form);
      }
      toast.success('Settings Saved', 'System configurations updated.');
    } catch (err: any) {
      toast.error('Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Settings size={22} color="var(--primary-red)" />
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Platform Settings</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Enterprise entity configuration, payroll parameters & system preferences
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        {/* Settings Navigation / Side Info */}
        <div className="card-luxury" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-red)', fontWeight: 700, fontSize: '0.875rem' }}>
            <Building2 size={16} /> Legal Entity & Entity Profile
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <Shield size={16} /> Security & RLS Policies
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <Database size={16} /> Supabase Connectivity
          </div>
        </div>

        {/* Company Settings Form */}
        <div className="card-luxury" style={{ padding: '28px' }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              Company Legal Entity
            </h3>

            <Input
              label="Company Legal Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Tax ID / GSTIN"
                value={form.tax_id}
                onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
              />
              <Input
                label="Registration Number (CIN)"
                value={form.registration_number}
                onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select
                label="Base Currency"
                options={[
                  { value: 'INR', label: 'INR (₹) — Indian Rupee' },
                  { value: 'USD', label: 'USD ($) — US Dollar' },
                  { value: 'EUR', label: 'EUR (€) — Euro' },
                ]}
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              />
              <Input
                label="Country of Incorporation"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>

            <Input
              label="Headquarters Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <Button variant="primary" type="submit" isLoading={isSaving}>
                Save Platform Preferences
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

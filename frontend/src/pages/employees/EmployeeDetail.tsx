import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeesApi } from '../../api/endpoints';
import { Employee, EmployeeSmartCounts } from '../../types';
import { getInitials, formatDate } from '../../utils/formatters';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmployeeFormModal } from './EmployeeFormModal';
import { useAuth } from '../../context/AuthContext';
import {
  FileSignature,
  Clock,
  CalendarDays,
  Receipt,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  CreditCard,
  Edit,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export const EmployeeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, isHR } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [smartCounts, setSmartCounts] = useState<EmployeeSmartCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Invite state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'EMPLOYEE' | 'HR_MANAGER' | 'HR_PAYROLL_USER' | 'HR_PAYROLL_MANAGER' | 'ADMIN'>('EMPLOYEE');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [directLink, setDirectLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [empRes, countRes] = await Promise.all([
        employeesApi.getById(id),
        employeesApi.getSmartCounts(id),
      ]);
      if (empRes.success && empRes.data) setEmployee(empRes.data);
      if (countRes.success && countRes.data) setSmartCounts(countRes.data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSendInvite = async () => {
    if (!id || !employee) return;
    setIsInviting(true);
    setInviteStatus(null);
    setDirectLink(null);
    setCopied(false);
    try {
      const res = await employeesApi.invite(id, { role: selectedRole }) as any;
      if (res.success) {
        setInviteStatus({
          type: 'success',
          message: res.data?.message || `Invitation sent successfully to ${employee.work_email}!`,
        });
        if (res.data?.action_link) {
          setDirectLink(res.data.action_link);
        }
      } else {
        setInviteStatus({
          type: 'error',
          message: res.error?.message || 'Failed to send invitation. Please try again.',
        });
      }
    } catch (err: any) {
      setInviteStatus({
        type: 'error',
        message: err.message || 'An unexpected error occurred while sending the invite.',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return <div style={{ padding: '40px', color: 'var(--text-dim)', textAlign: 'center' }}>Loading employee profile...</div>;
  }

  if (!employee) {
    return <div style={{ padding: '40px', color: 'var(--text-dim)', textAlign: 'center' }}>Employee not found.</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/employees')}>
          Back to Directory
        </Button>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(isAdmin || isHR) && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Send size={16} />}
              onClick={() => {
                setInviteStatus(null);
                setIsInviteModalOpen(true);
              }}
            >
              Send Portal Invite
            </Button>
          )}
          <Button variant="primary" size="sm" leftIcon={<Edit size={16} />} onClick={() => setIsEditModalOpen(true)}>
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Header Profile Card */}
      <div
        className="card-luxury"
        style={{
          padding: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(220, 38, 38, 0.15)',
              border: '2px solid var(--primary-red)',
              color: 'var(--primary-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 800,
            }}
          >
            {getInitials(employee.first_name, employee.last_name)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>
                {employee.first_name} {employee.last_name}
              </h1>
              <Badge status={employee.status} />
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {employee.job_position?.title || 'Team Member'} • {employee.department?.name || 'Unassigned'}
            </div>
          </div>
        </div>

        {/* Smart Buttons (Editorial Styled Counters) */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/contracts?employee_id=' + employee.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '0.375em',
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '85px',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <span style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--primary-red)' }}>
              {smartCounts?.contracts_count ?? 0}
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
              Contracts
            </span>
          </button>

          <button
            onClick={() => navigate('/attendance?employee_id=' + employee.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '0.375em',
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '85px',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <span style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--primary-red)' }}>
              {smartCounts?.attendance_count ?? 0}
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
              Attendance
            </span>
          </button>

          <button
            onClick={() => navigate('/time-off?employee_id=' + employee.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '0.375em',
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '85px',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <span style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--status-warning)' }}>
              {smartCounts?.time_off_requests_count ?? 0}
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
              Time Off
            </span>
          </button>

          <button
            onClick={() => navigate('/payslips?employee_id=' + employee.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '0.375em',
              backgroundColor: 'var(--bg-sidebar)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: '85px',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <span style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--status-success)' }}>
              {smartCounts?.payslips_count ?? 0}
            </span>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
              Payslips
            </span>
          </button>
        </div>
      </div>

      {/* 2-Column Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Work & Job Information */}
        <div className="card-luxury" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            Work & Organization
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Department</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>{employee.department?.name || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Job Title</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>{employee.job_position?.title || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Schedule</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>{employee.schedule?.name || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Hire Date</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>{formatDate(employee.hire_date)}</div>
            </div>
          </div>
        </div>

        {/* Banking & Statutory Details */}
        <div className="card-luxury" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            Banking & Payroll Compliance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.875rem' }}>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Bank Name</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>{employee.bank_name || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Account Number</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>{employee.bank_account_number || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>IFSC Code</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>{employee.bank_ifsc || '—'}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>PAN Number</div>
              <div style={{ color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>{employee.pan_number || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <EmployeeFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={loadData}
        employee={employee}
      />

      {/* Portal Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => !isInviting && setIsInviteModalOpen(false)}
        title="Invite Employee to Portal"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Send an onboarding invitation email to <strong style={{ color: '#ffffff' }}>{employee.work_email}</strong>. The employee will receive a secure magic link to activate their account and set up their personal login password.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-dim)' }}>
              Assigned Portal Access Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              disabled={isInviting}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '0.375em',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            >
              <option value="EMPLOYEE">EMPLOYEE (Self-Service Portal Only)</option>
              <option value="HR_MANAGER">HR_MANAGER (Employee Management & Approvals)</option>
              <option value="HR_PAYROLL_USER">HR_PAYROLL_USER (Payroll & Payslip Viewer)</option>
              <option value="HR_PAYROLL_MANAGER">HR_PAYROLL_MANAGER (Full Payroll Engine & Approval)</option>
              <option value="ADMIN">ADMIN (Full System Administrator)</option>
            </select>
          </div>

          {inviteStatus && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '0.375em',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.875rem',
                backgroundColor: inviteStatus.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-danger-bg)',
                border: `1px solid ${inviteStatus.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)'}`,
                color: inviteStatus.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
              }}
            >
              {inviteStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{inviteStatus.message}</span>
            </div>
          )}

          {directLink && (
            <div
              style={{
                padding: '14px',
                borderRadius: '0.375em',
                backgroundColor: 'var(--bg-sidebar)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  Direct Activation Link (Instant Access)
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', fontWeight: 600 }}>
                  Ready to activate
                </span>
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: '0.375em',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                  fontFamily: 'var(--font-mono)',
                  maxHeight: '60px',
                  overflowY: 'auto',
                }}
              >
                {directLink}
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  onClick={() => copyToClipboard(directLink)}
                >
                  {copied ? 'Copied Link!' : 'Copy Link'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ExternalLink size={14} />}
                  onClick={() => window.open(directLink, '_blank')}
                >
                  Open Setup Page
                </Button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <Button
              variant="ghost"
              size="md"
              disabled={isInviting}
              onClick={() => setIsInviteModalOpen(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isInviting}
              leftIcon={<Send size={16} />}
              onClick={handleSendInvite}
            >
              {directLink ? 'Resend Invite' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

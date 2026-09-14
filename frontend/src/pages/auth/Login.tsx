import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Banknote, Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';
import { DoodleCompass, DoodleHandshake } from '../../components/doodles/DoodleArt';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Validation Error', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
      toast.success('Authentication Successful', 'Welcome to HR Pay 360');
      // Auth context will redirect or trigger navigation
      navigate('/dashboard');
    } catch (err: any) {
      toast.error('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail: string, pass = 'TestPass123!') => {
    setEmail(roleEmail);
    setPassword(pass);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#09090b',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background radial gradient glow */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, rgba(9, 9, 11, 0) 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Golden Compass Doodle Backdrop */}
      <div
        style={{
          position: 'absolute',
          top: '-15px',
          right: '-15px',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <DoodleCompass size={300} color="#d4af37" opacity={0.6} />
      </div>

      <div
        className="glass-modal animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '16px',
          padding: '36px 32px',
          position: 'relative',
          zIndex: 10,
          overflow: 'hidden',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          boxShadow: '0 0 35px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.08)',
        }}
      >
        {/* Golden Handshake Doodle watermark inside auth modal */}
        <div
          style={{
            position: 'absolute',
            bottom: '-20px',
            right: '-25px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <DoodleHandshake size={200} color="#d4af37" opacity={0.55} />
        </div>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(220, 38, 38, 0.45)',
              marginBottom: '16px',
            }}
          >
            <Banknote size={26} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f4f4f5', letterSpacing: '-0.03em' }}>
            HR Pay<span style={{ color: 'var(--primary-red)' }}> 360</span>
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Enterprise HR & Deterministic Payroll
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label="Work Email"
            type="email"
            required
            placeholder="admin@hrpay360.com"
            leftIcon={<Mail size={16} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            required
            placeholder="••••••••••••"
            leftIcon={<Lock size={16} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight size={18} />}
            style={{ width: '100%', marginTop: '6px' }}
          >
            Sign In to Portal
          </Button>
        </form>

        {/* Quick Demo Logins for Pair Programming & Testing */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', textAlign: 'center' }}>
            Demo Quick-Fill Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@example.com')}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: '#161619',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('hr.manager@example.com')}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: '#161619',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              HR Manager
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('payroll@example.com')}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: '#161619',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Payroll Manager
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('employee@example.com')}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                backgroundColor: '#161619',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Employee Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

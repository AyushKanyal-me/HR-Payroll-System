import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Banknote, Lock, Mail, ArrowRight, Sun, Moon } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
        backgroundColor: 'var(--bg-app)',
        padding: '24px',
        position: 'relative',
        transition: 'background-color 0.2s ease-in-out',
      }}
    >
      {/* Theme toggle in top-right */}
      <button
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Editorial Light Mode' : 'Switch to Dark Mode'}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '0.375em',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-main)',
          cursor: 'pointer',
          boxShadow: 'var(--card-shadow)',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div
        className="glass-modal animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          borderRadius: '8px',
          padding: '40px 36px',
          position: 'relative',
          zIndex: 10,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--card-shadow-hover)',
        }}
      >
        {/* Top Accent Strip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            backgroundColor: 'var(--primary-red)',
          }}
        />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '0.375em',
              backgroundColor: 'var(--primary-red)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 106, 106, 0.35)',
              marginBottom: '16px',
            }}
          >
            <Banknote size={26} color="#ffffff" />
          </div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-main)',
              letterSpacing: '-0.01em',
            }}
          >
            HR Pay<span style={{ color: 'var(--primary-red)' }}> 360</span>
          </h1>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
              fontFamily: 'var(--font-sans)',
            }}
          >
            Enterprise HR & Deterministic Payroll Platform
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

        {/* Quick Demo Logins */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '10px',
              textAlign: 'center',
            }}
          >
            Demo Quick-Fill Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@example.com')}
              style={{
                padding: '8px 10px',
                borderRadius: '0.375em',
                backgroundColor: 'var(--bg-sidebar)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-red)';
                e.currentTarget.style.color = 'var(--primary-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('hr.manager@example.com')}
              style={{
                padding: '8px 10px',
                borderRadius: '0.375em',
                backgroundColor: 'var(--bg-sidebar)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-red)';
                e.currentTarget.style.color = 'var(--primary-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
            >
              HR Manager
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('payroll@example.com')}
              style={{
                padding: '8px 10px',
                borderRadius: '0.375em',
                backgroundColor: 'var(--bg-sidebar)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-red)';
                e.currentTarget.style.color = 'var(--primary-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
            >
              Payroll Manager
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('employee@example.com')}
              style={{
                padding: '8px 10px',
                borderRadius: '0.375em',
                backgroundColor: 'var(--bg-sidebar)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease-in-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-red)';
                e.currentTarget.style.color = 'var(--primary-red)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-main)';
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

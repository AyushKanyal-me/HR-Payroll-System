import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Banknote, Lock, CheckCircle2, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';

export const SetupAccount: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
        }
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        } else {
          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user?.email) {
              setUserEmail(session.user.email);
            }
          });
          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.error('Error verifying auth state:', err);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      toast.success('Account Activated', 'Your password has been successfully established.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to set password. Your invitation link may have expired.');
      toast.error('Setup Failed', err.message || 'Failed to update account.');
    } finally {
      setIsLoading(false);
    }
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
      <div
        className="glass-modal animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '8px',
          padding: '40px 36px',
          position: 'relative',
          zIndex: 10,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--card-shadow-hover)',
        }}
      >
        {/* Top Accent Bar */}
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
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px', fontFamily: 'var(--font-sans)' }}>
            Welcome to the team! Set up your secure account password to access the portal.
          </p>
        </div>

        {isSuccess ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-success-bg)',
                border: '2px solid var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--status-success)',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <div>
              <h2
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--text-main)',
                  marginBottom: '6px',
                }}
              >
                Account Setup Complete!
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Your password is now active. You can proceed directly to your employee workspace.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight size={18} />}
              onClick={() => navigate('/dashboard')}
              style={{ width: '100%', marginTop: '10px' }}
            >
              Continue to Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {userEmail && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '0.375em',
                  backgroundColor: 'var(--bg-sidebar)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <ShieldCheck size={18} style={{ color: 'var(--status-success)' }} />
                <div style={{ fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Activating account for: </span>
                  <strong style={{ color: 'var(--text-main)' }}>{userEmail}</strong>
                </div>
              </div>
            )}

            {errorMessage && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '0.375em',
                  backgroundColor: 'var(--status-danger-bg)',
                  border: '1px solid var(--status-danger)',
                  color: 'var(--status-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.875rem',
                }}
              >
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <Input
              label="Choose Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock size={18} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              rightIcon={<ArrowRight size={18} />}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Set Password & Log In
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

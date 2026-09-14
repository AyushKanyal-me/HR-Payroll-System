import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = {
    success: (title: string, message?: string) => addToast('success', title, message),
    error: (title: string, message?: string) => addToast('error', title, message),
    warning: (title: string, message?: string) => addToast('warning', title, message),
    info: (title: string, message?: string) => addToast('info', title, message),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Render Portal */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px', width: '100%' }}>
        {toasts.map((t) => {
          let borderColor = '#27272a';
          let icon = <Info size={18} color="#3b82f6" />;
          if (t.type === 'success') {
            borderColor = 'rgba(16, 185, 129, 0.4)';
            icon = <CheckCircle2 size={18} color="#10b981" />;
          } else if (t.type === 'error') {
            borderColor = 'rgba(239, 68, 68, 0.4)';
            icon = <XCircle size={18} color="#ef4444" />;
          } else if (t.type === 'warning') {
            borderColor = 'rgba(245, 158, 11, 0.4)';
            icon = <AlertTriangle size={18} color="#f59e0b" />;
          }

          return (
            <div
              key={t.id}
              className="animate-slide-down"
              style={{
                backgroundColor: '#121214',
                border: '1px solid ' + borderColor,
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f4f4f5' }}>{t.title}</div>
                {t.message && (
                  <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '2px' }}>{t.message}</div>
                )}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

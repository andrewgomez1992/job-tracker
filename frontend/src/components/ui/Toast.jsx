import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import clsx from 'clsx';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const push = useCallback((toast) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    timers.current.set(id, setTimeout(() => dismiss(id), toast.duration ?? 4200));
    return id;
  }, [dismiss]);

  const value = useMemo(() => ({
    toast: push,
    success: (title, message) => push({ variant: 'success', title, message }),
    error: (title, message) => push({ variant: 'error', title, message, duration: 6500 }),
    info: (title, message) => push({ variant: 'info', title, message }),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className={styles.viewport} role="region" aria-live="polite">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.variant] ?? Info;
            return (
              <div key={toast.id} className={clsx(styles.toast, styles[toast.variant ?? 'info'])}>
                <Icon size={17} className={styles.icon} aria-hidden />
                <div className={styles.content}>
                  <div className={styles.title}>{toast.title}</div>
                  {toast.message && <div className={styles.message}>{toast.message}</div>}
                  {toast.action && (
                    <button type="button" className={styles.action}
                      onClick={() => { toast.action.onClick(); dismiss(toast.id); }}>
                      {toast.action.label}
                    </button>
                  )}
                </div>
                <button type="button" className={styles.dismiss} onClick={() => dismiss(toast.id)} aria-label="Dismiss">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}

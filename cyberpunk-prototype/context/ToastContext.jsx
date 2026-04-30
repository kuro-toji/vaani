import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  }, []);

  const toast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  // Convenience methods
  toast.success = (msg, d) => toast({ message: msg, type: 'success', duration: d });
  toast.error   = (msg, d) => toast({ message: msg, type: 'error',   duration: d });
  toast.warning = (msg, d) => toast({ message: msg, type: 'warning', duration: d });
  toast.info    = (msg, d) => toast({ message: msg, type: 'info',     duration: d });

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast portal — rendered at body level */}
      <div className="toast-container" role="region" aria-label="Notifications">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <span className="flex-1 text-sm">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-2 text-xs opacity-60 hover:opacity-100 cursor-pointer"
              style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', padding: '4px' }}
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
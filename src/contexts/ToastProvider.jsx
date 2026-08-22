import { useCallback, useMemo, useState } from 'react';
import { ToastContext } from './ToastContext';

let toastIdCounter = 0;

/**
 * Global Toast notification provider.
 *
 * Provides a `showToast` function that any component can call:
 *   showToast('Job posted successfully.', 'success');
 *   showToast('Unable to save. Please try again.', 'error');
 *
 * Supports: success, error, warning, info
 * Auto-dismisses after the specified duration (default 5s for success, 8s for errors).
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success', duration) => {
      const id = ++toastIdCounter;

      // Default durations: success=4s, info=4s, warning=6s, error=8s
      const defaultDuration =
        type === 'error' ? 8000 : type === 'warning' ? 6000 : 4000;
      const dismissAfter = duration ?? defaultDuration;

      setToasts((prev) => [...prev, { id, message, type }]);

      if (dismissAfter > 0) {
        setTimeout(() => removeToast(id), dismissAfter);
      }

      return id;
    },
    [removeToast],
  );

  const value = useMemo(
    () => ({ toasts, showToast, removeToast }),
    [toasts, showToast, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container rendered at the root level */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

/* ── Visual toast container ─────────────────────────────────────────── */

const TYPE_STYLES = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-600 text-white',
};

const TYPE_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex w-full max-w-sm flex-col gap-2 pointer-events-none sm:bottom-6 sm:right-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg ring-1 ring-black/5 animate-slide-in ${TYPE_STYLES[toast.type] || TYPE_STYLES.info}`}
        >
          <span className="mt-0.5 text-base font-bold" aria-hidden="true">
            {TYPE_ICONS[toast.type] || TYPE_ICONS.info}
          </span>
          <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-2 mt-0.5 rounded p-0.5 text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Dismiss notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

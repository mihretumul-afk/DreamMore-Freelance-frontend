import { useContext } from 'react';
import { ToastContext } from '../contexts/ToastContext';

/**
 * Access the global toast notification system.
 *
 * Must be used inside <ToastProvider>.
 *
 * Usage:
 *   const { showToast } = useToast();
 *   showToast('Job posted successfully!', 'success');
 *   showToast('Something went wrong.', 'error');
 *   showToast('Please check your input.', 'warning');
 *   showToast('Loading data...', 'info');
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a <ToastProvider>.');
  }
  return context;
}

import { createContext } from 'react';

/**
 * Toast context — consumed by useToast and provided by ToastProvider.
 * Keeps the context in its own module for fast refresh compatibility.
 */
export const ToastContext = createContext(undefined);

import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Access the auth session. Must be used inside <AuthProvider>.
 *
 * `login` accepts { email, password, remember } — when `remember` is false the
 * session is stored in sessionStorage only (cleared when the tab closes).
 * @returns {{ user: object|null, token: string|null, loading: boolean, login: Function, register: Function, logout: Function, refreshUser: Function }}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}

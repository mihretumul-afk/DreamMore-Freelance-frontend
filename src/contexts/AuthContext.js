import { createContext } from 'react';

/**
 * Raw context object — consumed by hooks/useAuth and provided by AuthProvider.
 * Kept in its own module so fast refresh is not broken by mixed exports.
 */
export const AuthContext = createContext(undefined);

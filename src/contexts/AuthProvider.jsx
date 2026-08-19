import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import {
  getToken,
  getUser,
  hasToken,
  setSession,
  updateStoredUser,
  clearStoredSession,
} from '../utils/authStorage';
import { authService } from '../services/authService';

/** Window event fired by the API client when a request 401s with a token. */
const UNAUTHORIZED_EVENT = 'appworks:unauthorized';

/**
 * AuthProvider — the single source of truth for the authentication session.
 *
 * Flow: React UI → AuthContext → authService → Axios client → Laravel API.
 *
 * - On mount the session is hydrated from the stored Sanctum token via
 *   GET /auth/me (loading stays true until that resolves, so protected
 *   routes never flash before the guard knows the user).
 * - `login` / `register` persist the token + user returned by the API.
 *   `login({ remember })` stores "remember me" sessions in localStorage and
 *   session-only logins in sessionStorage (see utils/authStorage.js) — the
 *   backend token is identical either way; only the local persistence scope
 *   changes. No password or sensitive credential is ever stored.
 * - `logout` revokes the token server-side (best effort) and always clears
 *   the local session.
 * - A 401 from any authenticated request (fired by the API client) clears
 *   the session so route guards redirect to /login.
 * - `refreshUser` re-fetches /auth/me (e.g. after a profile edit changes
 *   user-level fields like phone/bio) so auth state stays consistent.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // A cached user is only meaningful together with a stored token.
    if (!hasToken()) return null;
    return getUser();
  });
  const [token, setToken] = useState(() => getToken());
  const [loading, setLoading] = useState(() => hasToken());

  /** Persist an API-issued session (token + user) in storage and state. */
  const persistSession = useCallback((newToken, newUser, remember = true) => {
    setSession(newToken, newUser, remember);
    setToken(newToken);
    setUser(newUser);
  }, []);

  /** Clear the local session everywhere (storage + state). */
  const clearSession = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUser(null);
  }, []);

  // Hydrate the session from the stored token on first mount.
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!hasToken()) {
        if (!cancelled) {
          clearSession();
          setLoading(false);
        }
        return;
      }

      try {
        const freshUser = await authService.getCurrentUser();
        if (cancelled) return;
        updateStoredUser(freshUser);
        setUser(freshUser);
      } catch (error) {
        if (cancelled) return;
        if (error?.response?.status === 401) {
          // Token was rejected — drop the whole session.
          clearSession();
        }
        // Other failures (network / 5xx, e.g. backend DB unavailable): keep the
        // cached token + user so the app stays usable; guards still protect
        // routes, and any authenticated call that 401s clears the session.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // Keep React state in sync when the API client clears a 401'd session.
  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession]);

  /** Real login against POST /auth/login. Resolves to the authenticated user. */
  const login = useCallback(
    async ({ email, password, remember = true }) => {
      const { user: authedUser, token: accessToken } = await authService.login({
        email,
        password,
      });
      persistSession(accessToken, authedUser, remember);
      return authedUser;
    },
    [persistSession],
  );

  /** Real registration against POST /auth/register. Resolves to the new user. */
  const register = useCallback(
    async (payload) => {
      const { user: newUser, token: accessToken } = await authService.register(payload);
      persistSession(accessToken, newUser, true);
      return newUser;
    },
    [persistSession],
  );

  /**
   * Real logout: revoke the token server-side (best effort — if it is already
   * invalid the API 401s and the client clears storage) then always clear the
   * local session so protected routes reject access immediately.
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Token may already be revoked/expired — local cleanup still happens.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  /**
   * Re-fetch the current user from GET /auth/me and update state + storage.
   * Used after operations that change user-level fields (e.g. employer
   * profile edits that update phone/bio). Throws on failure (a 401 clears
   * the session via the shared unauthorized handling).
   */
  const refreshUser = useCallback(async () => {
    const freshUser = await authService.getCurrentUser();
    updateStoredUser(freshUser);
    setUser(freshUser);
    return freshUser;
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshUser }),
    [user, token, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

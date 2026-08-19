import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../constants/app';

/**
 * Session storage helpers — the single place that decides where the Sanctum
 * token + cached user live.
 *
 * "Remember me" sessions persist in localStorage (they survive browser
 * restarts). Session-only logins (checkbox unticked) store in sessionStorage,
 * which the browser clears when the tab closes — the token itself is still
 * issued by the backend exactly the same way; only the local persistence
 * scope changes. No password or sensitive credential is ever stored.
 *
 * Both storages are always read so existing localStorage sessions keep
 * working, and stale copies in the inactive store are removed on write so a
 * session can never be resurrected from the wrong store.
 */

/** The storage that currently holds the active session. */
function activeStore() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) != null ? localStorage : sessionStorage;
}

/** Read the token from whichever storage holds it. */
export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) ?? sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

/** Whether a token exists in either storage. */
export function hasToken() {
  return getToken() != null;
}

/** Read the cached user from the storage that holds the token. */
export function getUser() {
  if (!hasToken()) return null;
  const raw = activeStore().getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Persist a fresh session. `remember` chooses the durable (localStorage) or
 * session-only (sessionStorage) store and clears the other one first.
 */
export function setSession(token, user, remember = true) {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem(TOKEN_STORAGE_KEY);
  other.removeItem(USER_STORAGE_KEY);
  store.setItem(TOKEN_STORAGE_KEY, token);
  store.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/** Refresh the cached user in whichever storage holds the session. */
export function updateStoredUser(user) {
  if (!hasToken()) return;
  activeStore().setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/** Clear the session from both storages. */
export function clearStoredSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(USER_STORAGE_KEY);
}

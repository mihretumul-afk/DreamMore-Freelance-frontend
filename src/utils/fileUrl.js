import { getToken } from './authStorage';
import { API_BASE_URL } from '../config/env';

/**
 * Generate an authenticated file download URL.
 * The stored_path from DB already includes the prefix (e.g. "milestone-submissions/57/file.mp4").
 * We strip the prefix and let the route handle it cleanly.
 *
 * @param {string} storedPath - The stored file path from DB (e.g. "milestone-submissions/57/file.mp4")
 * @param {'submission'|'attachment'} type - The type of file
 * @returns {string} Full authenticated URL
 */
export function getAuthenticatedFileUrl(storedPath, type = 'submission') {
  const token = getToken();
  // Strip the known prefix from stored_path to avoid double-prefix
  const cleanPath = storedPath
    .replace(/^milestone-submissions\//, '')
    .replace(/^milestone-attachments\//, '');
  const url = `${API_BASE_URL}/milestone-${type === 'submission' ? 'submissions' : 'attachments'}/${cleanPath}`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

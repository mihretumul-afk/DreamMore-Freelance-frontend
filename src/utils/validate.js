/**
 * Accepts http/https URLs only — matches the backend's `url` validation rule,
 * which requires a scheme. Empty values pass (the fields are optional).
 * @param {string} value
 * @returns {boolean}
 */
export function isHttpUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Convert an Axios error into a safe, user-friendly message.
 *
 * - Network failures get a connection hint.
 * - 5xx responses never surface backend internals (logs, SQL, stack traces).
 * - 4xx responses may use the backend's own `message` when one is present.
 *
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.code === 'ERR_NETWORK' || !error?.response) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  const status = error.response.status;
  if (status >= 500) {
    return 'The service is temporarily unavailable. Please try again in a moment.';
  }

  return error.response.data?.message || fallback;
}

/**
 * Extract backend field errors ({ field: message }) from a Laravel 422
 * validation response. Returns an empty object when there are none.
 *
 * Laravel sends `errors` as an object of arrays; only the first message per
 * field is surfaced to keep the UI readable.
 *
 * @param {unknown} error
 * @returns {Record<string, string>}
 */
export function getFieldErrors(error) {
  const errors = error?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return {};

  const fieldErrors = {};
  Object.entries(errors).forEach(([field, messages]) => {
    const first = Array.isArray(messages) ? messages[0] : messages;
    if (typeof first === 'string') fieldErrors[field] = first;
  });
  return fieldErrors;
}

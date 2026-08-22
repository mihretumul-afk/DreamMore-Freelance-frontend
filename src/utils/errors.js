/**
 * Convert an Axios error into a safe, user-friendly message.
 *
 * - Network failures get a connection hint.
 * - 5xx responses never surface backend internals (logs, SQL, stack traces).
 * - 4xx responses use the backend's own `message` when one is present.
 * - Client runtime errors surface their error message instead of falsely claiming server failure.
 *
 * @param {unknown} error
 * @param {string} [fallback]
 * @returns {string}
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  // Only surface "Unable to reach the server" when it is genuinely a network or timeout error
  if (
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.message === 'Network Error'
  ) {
    return 'Unable to reach the server. Please check your connection and try again.';
  }

  if (error?.response) {
    const status = error.response.status;
    if (status >= 500) {
      return 'The service is temporarily unavailable. Please try again in a moment.';
    }
    return error.response.data?.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
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

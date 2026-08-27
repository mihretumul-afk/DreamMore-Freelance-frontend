/**
 * Format an amount as Ethiopian Birr.
 * @param {number|string|null|undefined} amount
 * @returns {string} e.g. "ETB 45,000"
 */
export function formatETB(amount) {
  const value = Number(amount ?? 0);
  if (Number.isNaN(value)) return 'ETB 0';
  return `ETB ${value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a number as currency using the platform's default currency.
 *
 * @param {number|string} amount - The amount to format
 * @param {string} currency - Currency code (e.g., 'ETB', 'USD')
 * @param {object} options - Intl.NumberFormat options
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'ETB', options = {}) {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return `${currency} 0.00`;
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });

  return formatter.format(numAmount);
}

/**
 * Format a number as compact currency (e.g., "$1.2K", "ETB 500").
 *
 * @param {number|string} amount - The amount to format
 * @param {string} currency - Currency code
 * @returns {string} Compact formatted currency string
 */
export function formatCurrencyCompact(amount, currency = 'ETB') {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return `${currency} 0`;
  }

  if (numAmount >= 1000000) {
    return `${currency} ${(numAmount / 1000000).toFixed(1)}M`;
  }
  if (numAmount >= 1000) {
    return `${currency} ${(numAmount / 1000).toFixed(1)}K`;
  }

  return `${currency} ${numAmount}`;
}

/**
 * Format an ISO date string for display.
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Relative time label for an ISO date string (e.g. "3 days ago").
 * @param {string|null|undefined} value
 * @returns {string|null}
 */
export function timeAgo(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

/**
 * Format a number with commas (e.g., 1,234,567).
 *
 * @param {number|string} num - The number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;

  if (isNaN(numValue)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US').format(numValue);
}

/**
 * Format a file size in bytes to a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

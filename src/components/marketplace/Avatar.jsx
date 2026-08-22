import { useState } from 'react';
import { cn } from '../../utils/cn';
import { API_BASE_URL } from '../../config/env';

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

/**
 * Resolve avatar URL to handle relative /storage paths or backend host differences.
 */
function resolveAvatarUrl(src) {
  if (!src) return null;
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;

  const backendHost = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

  if (src.startsWith('/storage/')) {
    return `${backendHost}${src}`;
  }

  // Handle localhost vs 127.0.0.1 mismatch if needed
  if (src.startsWith('http://localhost:8000/storage/') || src.startsWith('http://127.0.0.1:8000/storage/')) {
    const path = src.substring(src.indexOf('/storage/'));
    return `${backendHost}${path}`;
  }

  return src;
}

/**
 * Avatar. Falls back to initials derived from `name` when no image is
 * available or if image loading fails.
 */
export default function Avatar({ name = '?', src, alt, size = 'md', variant = 'ink', className }) {
  const [imgError, setImgError] = useState(false);
  const resolvedSrc = !imgError ? resolveAvatarUrl(src) : null;

  const initials = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?';

  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
        alt={alt ?? name}
        onError={() => setImgError(true)}
        className={cn('shrink-0 rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt ?? name}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold select-none',
        variant === 'brand' ? 'bg-brand-500 text-white' : 'bg-ink-900 text-white',
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}

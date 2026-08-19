import { cn } from '../../utils/cn';

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-xl',
};

/**
 * Avatar. Falls back to initials derived from `name` when no image is
 * available (the common case before real uploads exist).
 */
export default function Avatar({ name = '?', src, alt, size = 'md', variant = 'ink', className }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name}
        className={cn('shrink-0 rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={alt ?? name}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-bold',
        variant === 'brand' ? 'bg-brand-500 text-white' : 'bg-ink-900 text-white',
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}

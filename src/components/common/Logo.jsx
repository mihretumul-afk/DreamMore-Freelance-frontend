import { cn } from '../../utils/cn';

/**
 * Dream More brand mark — an inline SVG "D+M" monogram with an upward arrow.
 * Colors come from the design tokens (brand orange + ink), so the logo always
 * matches the current palette and stays crisp at any size.
 */
export function LogoMark({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 56 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn('h-9 w-auto', className)}
      {...props}
    >
      {/* Left stem (shared D / M leg) */}
      <rect x="4" y="8" width="6" height="28" rx="3" fill="var(--color-ink-900)" />
      {/* Orange D bowl */}
      <path d="M10 8h9c8.284 0 15 6.716 15 15s-6.716 15-15 15h-9V8z" fill="var(--color-brand-500)" />
      {/* M fold */}
      <path
        d="M14 14l10 16 9-16"
        stroke="var(--color-ink-900)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right stem */}
      <rect x="42" y="8" width="6" height="22" rx="3" fill="var(--color-ink-900)" />
      {/* Upward arrow */}
      <path d="M45 2v7" stroke="var(--color-ink-900)" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M41 5.5 45 2l4 3.5"
        stroke="var(--color-ink-900)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full logo: mark + "DreamMore" wordmark with the "Right work at right time"
 * tagline. `variant="light"` renders for dark surfaces (navbar, footer).
 */
export default function Logo({ variant = 'dark', tagline = true, className, markClassName }) {
  const light = variant === 'light';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      <span className="leading-none">
        <span
          className={cn(
            'block text-lg font-extrabold tracking-tight',
            light ? 'text-white' : 'text-ink-900',
          )}
        >
          DreamMore
        </span>
        {tagline && (
          <span
            className={cn(
              'mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.14em]',
              light ? 'text-brand-400' : 'text-brand-600',
            )}
          >
            Right work at right time
          </span>
        )}
      </span>
    </span>
  );
}

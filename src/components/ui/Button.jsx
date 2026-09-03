import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const base =
  'inline-flex items-center justify-center gap-2 rounded-button font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed';

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
  secondary: 'bg-ink-900 dark:bg-slate-800 text-white hover:bg-ink-800 dark:hover:bg-slate-700 active:bg-ink-700',
  outline:
    'border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-ink-900 dark:text-slate-100 hover:border-gray-400 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800',
  ghost: 'text-ink-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-ink-900 dark:hover:text-white',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700',
  success: 'bg-success-500 text-white hover:bg-success-600 active:bg-success-700',
  /** For quiet text buttons on dark surfaces (navbar). */
  nav: 'text-slate-200 hover:bg-white/10 hover:text-white',
  /** For text buttons on light surfaces (public navbar). */
  'nav-light': 'text-ink-600 dark:text-slate-300 hover:bg-ink-50 dark:hover:bg-slate-800 hover:text-ink-900 dark:hover:text-white',
};

const sizes = {
  xs: 'h-8 px-2.5 text-xs',
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

/**
 * Reusable button. Use `as` to render a different element while keeping
 * button styling, e.g. <Button as={Link} to="/jobs"> or <Button as="a" href="...">.
 */
export default function Button({
  as,
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  const Tag = as || 'button';
  const isNativeButton = Tag === 'button';
  return (
    <Tag
      type={isNativeButton ? type : undefined}
      disabled={isNativeButton ? disabled || loading : undefined}
      aria-busy={loading ? 'true' : undefined}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Tag>
  );
}

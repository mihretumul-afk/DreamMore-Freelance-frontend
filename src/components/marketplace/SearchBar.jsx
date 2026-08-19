import { Search, X } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

/**
 * Reusable search input. UI-only: submits the current value via `onSubmit`;
 * real search APIs are wired in later phases.
 */
export default function SearchBar({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'Search…',
  label = 'Search',
  icon: Icon = Search,
  submitLabel,
  size = 'md',
  className,
  ...props
}) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        'flex items-center gap-2 rounded-input border border-gray-300 bg-white px-3 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20',
        size === 'lg' && 'py-0.5',
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-full bg-transparent py-2 text-sm text-ink-900 placeholder:text-gray-400 focus:outline-none"
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange?.('')}
          aria-label="Clear search"
          className="shrink-0 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-ink-900"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
      {submitLabel && (
        <Button type="submit" size="sm" className="shrink-0">
          {submitLabel}
        </Button>
      )}
    </form>
  );
}

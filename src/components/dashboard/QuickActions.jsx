import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Grid of quick-action cards linking to existing routes only.
 * @param {{ items: Array<{ label: string, description?: string, to: string, icon: Function }>, className?: string }}
 */
export default function QuickActions({ items, className }) {
  return (
    <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2', className)}>
      {items.map(({ label, description, to, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50">
            <Icon className="h-5 w-5 text-brand-500" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-sm font-bold text-ink-900">
              {label}
              <ArrowRight
                className="h-3.5 w-3.5 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500"
                aria-hidden="true"
              />
            </p>
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}

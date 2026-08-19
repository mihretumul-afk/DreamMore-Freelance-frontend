import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Breadcrumbs. The last item is rendered as the current page; earlier items
 * with a `to` value become links.
 */
export default function Breadcrumbs({ items, className }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <ChevronRight className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
              )}
              {item.to && !isLast ? (
                <Link to={item.to} className="text-gray-500 transition-colors hover:text-ink-900">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(isLast ? 'font-semibold text-ink-900' : 'text-gray-500')}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

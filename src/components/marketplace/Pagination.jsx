import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';
import { cn } from '../../utils/cn';

function buildPageItems(page, totalPages) {
  const candidates = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...candidates].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items = [];
  let previous = 0;
  for (const p of pages) {
    if (p - previous > 1) items.push('ellipsis');
    items.push(p);
    previous = p;
  }
  return items;
}

/**
 * Pagination controls. Hides itself when there is only one page.
 */
export default function Pagination({ page = 1, totalPages = 1, onChange, className }) {
  if (totalPages <= 1) return null;

  const items = buildPageItems(page, totalPages);

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center', className)}>
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange?.(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="px-2.5"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        </li>
        {items.map((item, index) =>
          item === 'ellipsis' ? (
            <li key={`ellipsis-${index}`}>
              <span className="px-1 text-sm text-gray-400" aria-hidden="true">
                …
              </span>
            </li>
          ) : (
            <li key={item}>
              <Button
                variant={item === page ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => onChange?.(item)}
                aria-current={item === page ? 'page' : undefined}
                className="min-w-9 px-0"
              >
                {item}
              </Button>
            </li>
          ),
        )}
        <li>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange?.(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="px-2.5"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </li>
      </ul>
    </nav>
  );
}

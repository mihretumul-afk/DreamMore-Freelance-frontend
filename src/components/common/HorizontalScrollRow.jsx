import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * HorizontalScrollRow — sleek, accessible single-row horizontal carousel.
 *
 * Provides:
 * - Single-row horizontal scroll layout (`nowrap`, `snap-x`)
 * - Left/Right navigation buttons with disabled states and smooth scrolling
 * - Hidden scrollbars for clean UI while preserving touch/trackpad/mouse scroll
 * - Responsive layout to keep sections compact and easy to scan
 */
export default function HorizontalScrollRow({
  children,
  className,
  scrollStep = 340,
  renderControls,
}) {
  const containerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    checkScroll();

    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    // Re-check after child layout changes
    const observer = new ResizeObserver(() => checkScroll());
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [checkScroll, children]);

  const handleScroll = (direction) => {
    const el = containerRef.current;
    if (!el) return;
    const distance = direction === 'left' ? -scrollStep : scrollStep;
    el.scrollBy({ left: distance, behavior: 'smooth' });
  };

  const controls = (
    <div className="flex items-center gap-1.5" role="group" aria-label="Carousel navigation">
      <button
        type="button"
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        aria-label="Previous items"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-ink-700 shadow-xs transition-all duration-200',
          'hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-ink-700',
        )}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
        aria-label="Next items"
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-ink-700 shadow-xs transition-all duration-200',
          'hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-ink-700',
        )}
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className="relative">
      {renderControls && renderControls({ controls, canScrollLeft, canScrollRight, handleScroll })}

      <div
        ref={containerRef}
        className={cn(
          'flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 pb-4',
          '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          className,
        )}
        tabIndex={0}
        role="region"
        aria-label="Scrollable list"
      >
        {children}
      </div>
    </div>
  );
}

export { HorizontalScrollRow };

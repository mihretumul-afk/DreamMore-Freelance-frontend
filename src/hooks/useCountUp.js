import { useEffect, useRef, useState } from 'react';

/**
 * useCountUp — animates a number from 0 to `end` when the element scrolls
 * into view. Uses IntersectionObserver so it only fires once.
 *
 * @param {number} end       Target number
 * @param {object} [options]
 * @param {number} [options.duration]  Animation duration in ms (default 2000)
 * @param {number} [options.delay]     Delay before starting in ms (default 0)
 * @returns {{ ref, count }}
 */
export function useCountUp(end, { duration = 2000, delay = 0 } = {}) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setCount(end);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;

          const startTime = performance.now() + delay;

          function tick(now) {
            const elapsed = now - startTime;
            if (elapsed < 0) {
              requestAnimationFrame(tick);
              return;
            }

            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          }

          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [end, duration, delay]);

  return { ref, count };
}

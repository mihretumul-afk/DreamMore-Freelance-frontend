import { useEffect, useRef, useState } from 'react';
import Container from '../common/Container';

/**
 * VideoShowcase — autoplay background video with responsive handling.
 *
 * Features:
 * - Poster image fallback (shown while video loads or on mobile)
 * - Graceful fallback when video is unavailable
 * - Respects prefers-reduced-motion (skips autoplay)
 * - Mobile: shows poster only (saves bandwidth)
 * - Dark overlay for text contrast
 */
export default function VideoShowcase({ children }) {
  const videoRef = useRef(null);
  const [hasError, setHasError] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);

    const handler = (e) => setIsReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const showVideo = !isReducedMotion && !hasError;

  return (
    <section className="relative w-full overflow-hidden">
      <Container className="py-3 sm:py-6 lg:py-10 px-3 sm:px-6 lg:px-8">
        <div className="relative flex min-h-[480px] sm:min-h-[560px] lg:min-h-[640px] w-full items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl lg:rounded-[2rem] bg-ink-900">
          {showVideo && (
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/videos/hero-freelancers.mp4"
              onError={() => setHasError(true)}
              aria-hidden="true"
            >
              <source src="/videos/hero-freelancers.mp4" type="video/mp4" />
            </video>
          )}

          {/* Dark overlay for text contrast */}
          <div className="absolute inset-0 bg-black/45" />

          {/* Content */}
          <div className="relative z-10 w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-12 lg:py-16">
            {children}
          </div>
        </div>
      </Container>
    </section>
  );
}

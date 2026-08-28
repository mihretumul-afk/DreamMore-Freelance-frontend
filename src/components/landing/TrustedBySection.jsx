import { useState, useEffect, useCallback } from 'react';
import { Briefcase, DollarSign, Star, Clock, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import Container from '../common/Container';
import Reveal from '../common/Reveal';
import { useI18n } from '../../i18n';
import { useCountUp } from '../../hooks/useCountUp';
import { LOGO_COMPONENTS } from './CompanyLogos';

/* ------------------------------------------------------------------ */
/*  Infinite logo marquee                                              */
/* ------------------------------------------------------------------ */
function LogoMarquee() {
  return (
    <div className="relative overflow-hidden py-8">
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10" aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10" aria-hidden="true" />

      <div className="flex items-center gap-12 animate-marquee">
        {[...LOGO_COMPONENTS, ...LOGO_COMPONENTS].map((logo, i) => (
          <div key={`${logo.name}-${i}`} className="flex-shrink-0 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300">
            <logo.Component className="h-10 w-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card with animated counter                                    */
/* ------------------------------------------------------------------ */
function StatCard({ icon: Icon, numericValue, suffix, label, color, delay }) {
  const { ref, count } = useCountUp(numericValue, { duration: 2000, delay });

  return (
    <Reveal delay={delay} className="h-full">
      <div
        ref={ref}
        className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1"
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <p className="mt-4 text-3xl font-extrabold text-gray-900 tabular-nums">
          {count.toLocaleString()}{suffix}
        </p>
        <p className="mt-1 text-sm text-gray-500">{label}</p>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonial card                                                   */
/* ------------------------------------------------------------------ */
function TestimonialCard({ quote, name, role, delay }) {
  return (
    <Reveal delay={delay} className="h-full">
      <div className="relative h-full rounded-2xl bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
        <Quote className="absolute top-6 right-6 h-8 w-8 text-brand-500/20" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-gray-600 italic">"{quote}"</p>
        <div className="mt-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonial Carousel                                               */
/* ------------------------------------------------------------------ */
function TestimonialCarousel({ testimonials }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = testimonials.length;

  const goTo = useCallback((idx) => {
    setCurrent(((idx % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  return (
    <Reveal delay={400}>
      <div
        className="mt-14 relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-label="Testimonials carousel"
      >
        {/* Carousel track */}
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {testimonials.map((testimonial, i) => (
              <div key={testimonial.name} className="w-full flex-shrink-0 px-2 md:w-1/3 md:px-3">
                <TestimonialCard
                  quote={testimonial.quote}
                  name={testimonial.name}
                  role={testimonial.role}
                  delay={0}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-6 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-gray-100 text-gray-600 transition-all duration-200 hover:bg-brand-500 hover:text-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-6 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg border border-gray-100 text-gray-600 transition-all duration-200 hover:bg-brand-500 hover:text-white hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                i === current
                  ? 'w-8 bg-brand-500'
                  : 'w-2.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ================================================================== */
/*  MAIN SECTION                                                       */
/* ================================================================== */
export default function TrustedBySection() {
  const { t } = useI18n();

  const stats = [
    { icon: Briefcase, numericValue: 10000, suffix: '+', label: t('trusted.statJobs'), color: 'bg-blue-500' },
    { icon: DollarSign, numericValue: 2, suffix: 'M+', label: t('trusted.statPaid'), color: 'bg-emerald-500' },
    { icon: Star, numericValue: 98, suffix: '%', label: t('trusted.statRating'), color: 'bg-amber-500' },
    { icon: Clock, numericValue: 24, suffix: 'h', label: t('trusted.statResponse'), color: 'bg-purple-500' },
  ];

  const testimonials = [
    { quote: t('trusted.testimonial1Quote'), name: t('trusted.testimonial1Name'), role: t('trusted.testimonial1Role') },
    { quote: t('trusted.testimonial2Quote'), name: t('trusted.testimonial2Name'), role: t('trusted.testimonial2Role') },
    { quote: t('trusted.testimonial3Quote'), name: t('trusted.testimonial3Name'), role: t('trusted.testimonial3Role') },
  ];

  return (
    <section className="bg-gradient-to-b from-white via-gray-50 to-white py-16 lg:py-24" aria-labelledby="trusted-heading">
      <Container>
        {/* ── Heading ── */}
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-block rounded-full bg-brand-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-600">
              {t('trusted.eyebrow')}
            </span>
          </Reveal>
          <Reveal delay={100}>
            <h2 id="trusted-heading" className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t('trusted.title')}
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-4 text-base text-gray-500">{t('trusted.subtitle')}</p>
          </Reveal>
        </div>

        {/* ── Logo marquee ── */}
        <Reveal delay={300}>
          <div className="mt-12 rounded-2xl border border-gray-100 bg-white/50 px-4 shadow-sm backdrop-blur-sm">
            <p className="pt-4 text-center text-xs font-bold uppercase tracking-widest text-gray-400">
              {t('trusted.trustedByLabel')}
            </p>
            <LogoMarquee />
          </div>
        </Reveal>

        {/* ── Stats grid ── */}
        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              numericValue={stat.numericValue}
              suffix={stat.suffix}
              label={stat.label}
              color={stat.color}
              delay={i * 150}
            />
          ))}
        </div>

        {/* ── Testimonials Carousel ── */}
        <TestimonialCarousel testimonials={testimonials} />
      </Container>
    </section>
  );
}

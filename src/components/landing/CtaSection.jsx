import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Container from '../common/Container';
import Reveal from '../common/Reveal';
import Button from '../ui/Button';
import { useI18n } from '../../i18n';

export default function CtaSection() {
  const { t } = useI18n();

  return (
    <section className="bg-slate-50/70 py-8 lg:py-12" aria-labelledby="cta-heading">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-ink-900 px-6 py-10 text-white shadow-xl sm:px-12 lg:py-14">
            <div
              className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative z-10 mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Start Today
              </span>

              <h2
                id="cta-heading"
                className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl"
              >
                {t('cta.title') || 'Ready to Grow Your Business or Freelance Career?'}
              </h2>
              <p className="mt-2 text-sm text-white/80 sm:text-base max-w-2xl mx-auto">
                {t('cta.description') || 'Join thousands of Ethiopian businesses and expert freelancers thriving on DreamMore.'}
              </p>

              <div className="mt-6 flex justify-center">
                <Button
                  as={Link}
                  to="/register"
                  size="md"
                  className="w-full bg-emerald-500 text-white hover:bg-emerald-400 active:bg-emerald-600 sm:w-auto font-semibold shadow-md"
                >
                  Join DreamMore
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

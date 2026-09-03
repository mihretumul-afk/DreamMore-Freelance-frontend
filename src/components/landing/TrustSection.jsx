import { ShieldCheck } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import Reveal from '../common/Reveal';
import Card from '../ui/Card';
import { useI18n } from '../../i18n';

const TRUST_FEATURES = [
  { titleKey: 'trust.feature1Title', descriptionKey: 'trust.feature1Desc' },
  { titleKey: 'trust.feature2Title', descriptionKey: 'trust.feature2Desc' },
  { titleKey: 'trust.feature3Title', descriptionKey: 'trust.feature3Desc' },
  { titleKey: 'trust.feature4Title', descriptionKey: 'trust.feature4Desc' },
];

export default function TrustSection() {
  const { t } = useI18n();

  return (
    <section className="bg-white dark:bg-slate-900 py-16 lg:py-24 transition-colors" aria-labelledby="trust-heading">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow={t('trust.eyebrow')}
              title={t('trust.title')}
              description={t('trust.description')}
            />
            <h2 id="trust-heading" className="sr-only">
              {t('trust.srHeading')}
            </h2>
            <ul className="mt-8 space-y-5">
              {TRUST_FEATURES.map((feature) => (
                <li key={feature.titleKey} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-900 dark:text-slate-100">{t(feature.titleKey)}</h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-gray-500 dark:text-slate-400">
                      {t(feature.descriptionKey)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <Card variant="elevated" className="overflow-hidden">
              <div className="border-l-4 border-brand-500 p-8 sm:p-10">
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">
                  {t('trust.commitment')}
                </p>
                <blockquote className="mt-4 text-xl font-bold leading-relaxed text-ink-900 dark:text-slate-100 sm:text-2xl">
                  {t('trust.quote')}
                </blockquote>
                <p className="mt-5 text-sm text-gray-500 dark:text-slate-400">{t('trust.signature')}</p>
              </div>
            </Card>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

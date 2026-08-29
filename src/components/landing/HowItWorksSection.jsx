import { ClipboardList, Users, Briefcase, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../common/Container';
import Reveal from '../common/Reveal';
import Button from '../ui/Button';
import { useI18n } from '../../i18n';

const STEPS = [
  {
    step: '01',
    icon: ClipboardList,
    titleKey: 'how.employerStep1Title',
    descriptionKey: 'how.employerStep1Desc',
  },
  {
    step: '02',
    icon: Users,
    titleKey: 'how.employerStep2Title',
    descriptionKey: 'how.employerStep2Desc',
  },
  {
    step: '03',
    icon: Briefcase,
    titleKey: 'how.employerStep3Title',
    descriptionKey: 'how.employerStep3Desc',
  },
  {
    step: '04',
    icon: CreditCard,
    titleKey: 'how.employerStep4Title',
    descriptionKey: 'how.employerStep4Desc',
  },
];

function StepItem({ step, icon: Icon, titleKey, descriptionKey, delay }) {
  const { t } = useI18n();
  return (
    <Reveal delay={delay} className="flex flex-col items-center text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-brand-200/60 bg-white shadow-md transition-transform duration-300 hover:scale-105 hover:border-brand-400">
        <span className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-[11px] font-extrabold text-white shadow-xs">
          {step}
        </span>
        <Icon className="h-8 w-8 text-brand-600" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-bold text-ink-900">{t(titleKey)}</h3>
      <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-gray-500">
        {t(descriptionKey)}
      </p>
    </Reveal>
  );
}

export default function HowItWorksSection() {
  const { t } = useI18n();

  return (
    <section className="bg-slate-50/60 py-10 lg:py-12 border-b border-gray-100" aria-labelledby="how-it-works-heading">
      <Container>
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Simple Process
          </span>
          <h2
            id="how-it-works-heading"
            className="mt-2 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl"
          >
            {t('how.title')}
          </h2>
          <div className="mx-auto mt-2.5 h-1 w-12 rounded-full bg-brand-600" aria-hidden="true" />
        </div>

        {/* Steps grid with connecting lines */}
        <div className="relative mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* Horizontal connecting line (desktop only) */}
          <div
            className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-0.5 border-t-2 border-dashed border-brand-200 lg:block"
            aria-hidden="true"
          />

          {STEPS.map((item, index) => (
            <div key={item.titleKey} className="relative">
              <StepItem
                step={item.step}
                icon={item.icon}
                titleKey={item.titleKey}
                descriptionKey={item.descriptionKey}
                delay={index * 100}
              />
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Reveal delay={400} className="mt-8 text-center">
          <Button as={Link} to="/how-it-works" variant="primary" size="md">
            {t('how.ctaLabel')}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}

import { ClipboardList, Users, Briefcase, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../common/Container';
import Reveal from '../common/Reveal';
import Button from '../ui/Button';
import { useI18n } from '../../i18n';

const STEPS = [
  {
    icon: ClipboardList,
    titleKey: 'how.employerStep1Title',
    descriptionKey: 'how.employerStep1Desc',
  },
  {
    icon: Users,
    titleKey: 'how.employerStep2Title',
    descriptionKey: 'how.employerStep2Desc',
  },
  {
    icon: Briefcase,
    titleKey: 'how.employerStep3Title',
    descriptionKey: 'how.employerStep3Desc',
  },
  {
    icon: CreditCard,
    titleKey: 'how.employerStep4Title',
    descriptionKey: 'how.employerStep4Desc',
  },
];

function StepItem({ icon: Icon, titleKey, descriptionKey, delay }) {
  const { t } = useI18n();
  return (
    <Reveal delay={delay} className="flex flex-col items-center text-center">
      <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-gray-100 bg-white shadow-sm">
        <Icon className="h-9 w-9 text-blue-600" strokeWidth={1.4} aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-base font-bold text-gray-900">{t(titleKey)}</h3>
      <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-gray-500">
        {t(descriptionKey)}
      </p>
    </Reveal>
  );
}

export default function HowItWorksSection() {
  const { t } = useI18n();

  return (
    <section className="bg-white py-16 lg:py-24" aria-labelledby="how-it-works-heading">
      <Container>
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            {t('how.title')}
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-blue-600" aria-hidden="true" />
        </div>

        {/* Steps grid with connecting lines */}
        <div className="relative mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Horizontal connecting line (desktop only) */}
          <div
            className="absolute left-[12.5%] right-[12.5%] top-12 hidden h-px bg-gray-200 lg:block"
            aria-hidden="true"
          />

          {STEPS.map((step, index) => (
            <div key={step.titleKey} className="relative">
              <StepItem
                icon={step.icon}
                titleKey={step.titleKey}
                descriptionKey={step.descriptionKey}
                delay={index * 100}
              />
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Reveal delay={400} className="mt-14 text-center">
          <Button as={Link} to="/how-it-works" variant="primary" size="lg">
            {t('how.ctaLabel')}
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}

import { User, Building2 } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import Reveal from '../common/Reveal';
import Card from '../ui/Card';
import { useI18n } from '../../i18n';

const FREELANCER_STEPS = [
  { titleKey: 'how.freelancerStep1Title', descriptionKey: 'how.freelancerStep1Desc' },
  { titleKey: 'how.freelancerStep2Title', descriptionKey: 'how.freelancerStep2Desc' },
  { titleKey: 'how.freelancerStep3Title', descriptionKey: 'how.freelancerStep3Desc' },
  { titleKey: 'how.freelancerStep4Title', descriptionKey: 'how.freelancerStep4Desc' },
];

const EMPLOYER_STEPS = [
  { titleKey: 'how.employerStep1Title', descriptionKey: 'how.employerStep1Desc' },
  { titleKey: 'how.employerStep2Title', descriptionKey: 'how.employerStep2Desc' },
  { titleKey: 'how.employerStep3Title', descriptionKey: 'how.employerStep3Desc' },
  { titleKey: 'how.employerStep4Title', descriptionKey: 'how.employerStep4Desc' },
];

function StepCard({ role, icon: Icon, heading, steps, id, delay }) {
  const { t } = useI18n();
  return (
    <Reveal delay={delay} className="h-full">
      <Card id={id} className="h-full p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500">
            <Icon className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500">{role}</p>
            <h3 className="text-lg font-bold text-ink-900">{heading}</h3>
          </div>
        </div>

        <ol className="mt-6 space-y-5">
          {steps.map((step, index) => (
            <li key={step.titleKey} className="flex gap-4">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div>
                <h4 className="text-sm font-bold text-ink-900">{t(step.titleKey)}</h4>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-500">
                  {t(step.descriptionKey)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </Reveal>
  );
}

export default function HowItWorksSection() {
  const { t } = useI18n();

  return (
    <section className="bg-gray-50 py-16 lg:py-24" aria-labelledby="how-it-works-heading">
      <Container>
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={t('how.eyebrow')}
            title={t('how.title')}
            description={t('how.description')}
          />
        </Reveal>

        <h2 id="how-it-works-heading" className="sr-only">
          {t('how.srHeading')}
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StepCard
            id="for-freelancers"
            role={t('how.forFreelancers')}
            icon={User}
            heading={t('how.freelancerHeading')}
            steps={FREELANCER_STEPS}
            delay={0}
          />
          <StepCard
            id="for-employers"
            role={t('how.forEmployers')}
            icon={Building2}
            heading={t('how.employerHeading')}
            steps={EMPLOYER_STEPS}
            delay={120}
          />
        </div>
      </Container>
    </section>
  );
}

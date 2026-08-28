import {
  ClipboardList,
  Users,
  Briefcase,
  CreditCard,
  UserPlus,
  Search,
  MessageSquare,
  Star,
  Shield,
  Target,
  Globe,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Container from '../../components/common/Container';
import Reveal from '../../components/common/Reveal';
import Button from '../../components/ui/Button';
import { useI18n } from '../../i18n';

/* ------------------------------------------------------------------ */
/*  Step card used for both Employer & Freelancer journeys             */
/* ------------------------------------------------------------------ */
function StepCard({ stepNumber, icon: Icon, title, description, detail, isFreelancer }) {
  const color = isFreelancer ? 'blue' : 'indigo';
  const bgColor = isFreelancer ? 'bg-blue-50' : 'bg-indigo-50';
  const iconColor = isFreelancer ? 'text-blue-600' : 'text-indigo-600';
  const numberBg = isFreelancer ? 'bg-blue-600' : 'bg-indigo-600';
  const borderColor = isFreelancer ? 'border-blue-100' : 'border-indigo-100';

  return (
    <Reveal className="h-full">
      <div className="relative h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8">
        {/* Step number badge */}
        <div className={`absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full ${numberBg} text-xs font-bold text-white shadow-sm`}>
          {stepNumber}
        </div>

        {/* Icon */}
        <div className={`mt-2 flex h-14 w-14 items-center justify-center rounded-xl ${bgColor} border ${borderColor}`}>
          <Icon className={`h-7 w-7 ${iconColor}`} strokeWidth={1.5} aria-hidden="true" />
        </div>

        {/* Content */}
        <h3 className="mt-5 text-lg font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">{detail}</p>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  Benefit card                                                       */
/* ------------------------------------------------------------------ */
function BenefitCard({ icon: Icon, title, description }) {
  return (
    <Reveal className="h-full">
      <div className="h-full rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
          <Icon className="h-6 w-6 text-brand-500" strokeWidth={1.5} aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-base font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ accordion item                                                 */
/* ------------------------------------------------------------------ */
function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-gray-900 pr-4">{question}</span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="pb-5">
          <p className="text-sm leading-relaxed text-gray-500">{answer}</p>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  PAGE COMPONENT                                                     */
/* ================================================================== */
export default function HowItWorksPage() {
  const { t } = useI18n();

  const employerSteps = [
    { icon: ClipboardList, titleKey: 'how.empStep1Title', descKey: 'how.empStep1Desc', detailKey: 'how.empStep1Detail' },
    { icon: Search, titleKey: 'how.empStep2Title', descKey: 'how.empStep2Desc', detailKey: 'how.empStep2Detail' },
    { icon: Users, titleKey: 'how.empStep3Title', descKey: 'how.empStep3Desc', detailKey: 'how.empStep3Detail' },
    { icon: Star, titleKey: 'how.empStep4Title', descKey: 'how.empStep4Desc', detailKey: 'how.empStep4Detail' },
  ];

  const freelancerSteps = [
    { icon: UserPlus, titleKey: 'how.freeStep1Title', descKey: 'how.freeStep1Desc', detailKey: 'how.freeStep1Detail' },
    { icon: Search, titleKey: 'how.freeStep2Title', descKey: 'how.freeStep2Desc', detailKey: 'how.freeStep2Detail' },
    { icon: Briefcase, titleKey: 'how.freeStep3Title', descKey: 'how.freeStep3Desc', detailKey: 'how.freeStep3Detail' },
    { icon: CreditCard, titleKey: 'how.freeStep4Title', descKey: 'how.freeStep4Desc', detailKey: 'how.freeStep4Detail' },
  ];

  const benefits = [
    { icon: Shield, titleKey: 'how.benefit1Title', descKey: 'how.benefit1Desc' },
    { icon: Target, titleKey: 'how.benefit2Title', descKey: 'how.benefit2Desc' },
    { icon: Users, titleKey: 'how.benefit3Title', descKey: 'how.benefit3Desc' },
    { icon: Globe, titleKey: 'how.benefit4Title', descKey: 'how.benefit4Desc' },
  ];

  const faqs = [
    { qKey: 'how.faq1Q', aKey: 'how.faq1A' },
    { qKey: 'how.faq2Q', aKey: 'how.faq2A' },
    { qKey: 'how.faq3Q', aKey: 'how.faq3A' },
    { qKey: 'how.faq4Q', aKey: 'how.faq4A' },
  ];

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 py-20 lg:py-28">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />

        <Container className="relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-block rounded-full bg-brand-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-300">
                {t('how.eyebrow')}
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t('how.heroTitle')}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-brand-400" aria-hidden="true" />
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-6 text-lg leading-relaxed text-gray-300">
                {t('how.heroDesc')}
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── EMPLOYER STEPS ── */}
      <section className="py-16 lg:py-24" aria-labelledby="employer-steps-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-600">
                {t('how.forEmployersTitle')}
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h2 id="employer-steps-heading" className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {t('how.forEmployersTitle')}
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-3 text-base text-gray-500">{t('how.forEmployersSubtitle')}</p>
            </Reveal>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {employerSteps.map((step, i) => (
              <StepCard
                key={step.titleKey}
                stepNumber={i + 1}
                icon={step.icon}
                title={t(step.titleKey)}
                description={t(step.descKey)}
                detail={t(step.detailKey)}
                isFreelancer={false}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* ── FREELANCER STEPS ── */}
      <section className="bg-gray-50 py-16 lg:py-24" aria-labelledby="freelancer-steps-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="inline-block rounded-full bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
                {t('how.forFreelancersTitle')}
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h2 id="freelancer-steps-heading" className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {t('how.forFreelancersTitle')}
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-3 text-base text-gray-500">{t('how.forFreelancersSubtitle')}</p>
            </Reveal>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {freelancerSteps.map((step, i) => (
              <StepCard
                key={step.titleKey}
                stepNumber={i + 1}
                icon={step.icon}
                title={t(step.titleKey)}
                description={t(step.descKey)}
                detail={t(step.detailKey)}
                isFreelancer
              />
            ))}
          </div>
        </Container>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-16 lg:py-24" aria-labelledby="benefits-heading">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <h2 id="benefits-heading" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {t('how.benefitsTitle')}
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-brand-500" aria-hidden="true" />
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-4 text-base text-gray-500">{t('how.benefitsSubtitle')}</p>
            </Reveal>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b) => (
              <BenefitCard key={b.titleKey} icon={b.icon} title={t(b.titleKey)} description={t(b.descKey)} />
            ))}
          </div>
        </Container>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-gray-50 py-16 lg:py-24" aria-labelledby="faq-heading">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <Reveal>
                <h2 id="faq-heading" className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {t('how.faqTitle')}
                </h2>
              </Reveal>
              <Reveal delay={100}>
                <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-brand-500" aria-hidden="true" />
              </Reveal>
            </div>

            <Reveal delay={200} className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              {faqs.map((faq) => (
                <FaqItem key={faq.qKey} question={t(faq.qKey)} answer={t(faq.aKey)} />
              ))}
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-500 to-indigo-600 py-16 lg:py-24">
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />

        <Container className="relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t('how.pageCtaTitle')}
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <p className="mt-4 text-lg text-white/80">{t('how.pageCtaDesc')}</p>
            </Reveal>
            <Reveal delay={200}>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button as={Link} to="/register" variant="secondary" size="lg" className="min-w-[200px]">
                  {t('how.pageCtaSignUp')}
                </Button>
                <Button as={Link} to="/register" variant="outline" size="lg" className="min-w-[200px] border-white/30 text-white hover:bg-white/10 hover:text-white">
                  {t('how.pageCtaPostJob')}
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}

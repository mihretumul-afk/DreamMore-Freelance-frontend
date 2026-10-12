import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Users,
} from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import FreelancerCard from '../marketplace/FreelancerCard';
import HorizontalScrollRow from '../common/HorizontalScrollRow';
import EmptyState from '../common/EmptyState';
import Button from '../ui/Button';
import { freelancerService } from '../../services/freelancerService';
import { normalizeFreelancer } from '../../utils/freelancerMapper';
import { useI18n } from '../../i18n';

export default function FeaturedFreelancersSection() {
  const { t } = useI18n();
  const [realFreelancers, setRealFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Real Registered Database Freelancers ONLY
  useEffect(() => {
    let active = true;
    freelancerService
      .getFreelancers({ page: 1, sort: 'rating' })
      .then((res) => {
        if (!active) return;
        const rawList = res?.data ?? (Array.isArray(res) ? res : []);
        const list = rawList.map(normalizeFreelancer).filter(Boolean);
        setRealFreelancers(list);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-white dark:bg-slate-900 py-8 lg:py-10 border-b border-gray-100 dark:border-slate-800 transition-colors" aria-labelledby="featured-freelancers-heading">
      <Container>
        {/* Section Header */}
        <div className="mb-6 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <SectionHeading
            align="center"
            eyebrow={t('featuredFreelancers.eyebrow') || 'Top Talent'}
            title={t('featuredFreelancers.title') || 'Find a Freelancer for Every Work'}
            description={
              t('featuredFreelancers.description') ||
              'Developers, designers, marketers, and more — ready for your next project.'
            }
          />

          <Link
            to="/freelancers"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/60 dark:bg-brand-950/40 px-3.5 py-2 text-xs sm:text-sm font-semibold text-brand-600 dark:text-brand-400 shadow-2xs transition-all duration-200 hover:border-brand-300 hover:bg-brand-100/70 dark:hover:bg-brand-900/60 hover:text-brand-700"
          >
            {t('featuredFreelancers.viewAll') || 'View All Talent'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Horizontal Carousel Row for Registered Freelancer Cards */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-80 w-[80vw] max-w-[320px] sm:w-[320px] shrink-0 animate-pulse rounded-2xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : realFreelancers.length === 0 ? (
          <div className="w-full my-6">
            <EmptyState
              icon={Users}
              title="No Freelancers Registered Yet"
              description="There are currently no approved freelancers registered on the platform. Be the first to register!"
              action={
                <Button as={Link} to="/register" variant="primary" size="md">
                  <Users className="h-4 w-4 mr-2" /> Register as a Freelancer
                </Button>
              }
            />
          </div>
        ) : (
          <HorizontalScrollRow scrollStep={320}>
            <h2 id="featured-freelancers-heading" className="sr-only">
              {t('featuredFreelancers.title') || 'Featured freelancers'}
            </h2>

            {realFreelancers.map((freelancer, idx) => (
              <div key={freelancer.id || idx} className="w-[80vw] max-w-[320px] sm:w-[320px] shrink-0 snap-start">
                <FreelancerCard freelancer={freelancer} index={idx} className="h-full" />
              </div>
            ))}

            {/* Rightmost "Discover More Talent" Call-To-Action Card */}
            <div className="w-[80vw] max-w-[320px] sm:w-[320px] shrink-0 snap-start flex">
              <div className="relative w-full flex flex-col justify-between overflow-hidden rounded-2xl bg-blue-950 p-6 text-center text-white shadow-md border border-blue-900">
                {/* Background Glow */}
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand-500/20 blur-2xl pointer-events-none" />

                <div className="my-auto flex flex-col items-center py-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900/80 border border-blue-800 text-brand-400 shadow-inner">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-black leading-tight tracking-tight text-white">
                    Discover More Talent
                  </h3>
                  <p className="mt-2 text-xs text-blue-200 font-medium">
                    in the DreamMore Network
                  </p>
                </div>

                <div className="mt-4">
                  <Link
                    to="/freelancers"
                    className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-md transition-all duration-200 hover:bg-emerald-400 hover:shadow-lg focus:outline-none"
                  >
                    Discover DreamMore Talent
                  </Link>
                </div>
              </div>
            </div>
          </HorizontalScrollRow>
        )}
      </Container>
    </section>
  );
}

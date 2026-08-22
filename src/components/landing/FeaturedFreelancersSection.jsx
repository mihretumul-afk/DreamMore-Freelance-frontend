import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
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
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    freelancerService
      .getFreelancers({ page: 1, sort: 'rating' })
      .then((response) => {
        if (!active) return;
        const rawList = response?.data ?? (Array.isArray(response) ? response : []);
        const list = rawList.map(normalizeFreelancer).filter(Boolean);
        setFreelancers(list.slice(0, 8));
      })
      .catch(() => {
        // Graceful fallback — section simply stays empty.
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-white py-12 lg:py-16" aria-labelledby="featured-freelancers-heading">
      <Container>
        <HorizontalScrollRow
          scrollStep={320}
          renderControls={({ controls }) => (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeading
                eyebrow={t('featuredFreelancers.eyebrow') || 'Top talent'}
                title={t('featuredFreelancers.title') || 'Find a Freelancer for Every Work'}
                description={
                  t('featuredFreelancers.description') ||
                  'Developers, designers, marketers, and more — ready for your next project.'
                }
              />
              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                <Link
                  to="/freelancers"
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  {t('featuredFreelancers.viewAll') || 'View All Talent'}{' '}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                {controls}
              </div>
            </div>
          )}
        >
          <h2 id="featured-freelancers-heading" className="sr-only">
            {t('featuredFreelancers.title') || 'Featured freelancers'}
          </h2>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-64 w-[280px] sm:w-[320px] shrink-0 animate-pulse rounded-card border border-gray-200 bg-white snap-start"
              />
            ))
          ) : freelancers.length === 0 ? (
            <div className="w-full">
              <EmptyState
                icon={Users}
                title={t('featuredFreelancers.emptyTitle') || 'No freelancers yet'}
                description={
                  t('featuredFreelancers.emptyDescription') ||
                  'Be the first to join the marketplace.'
                }
                action={
                  <Button as={Link} to="/register" variant="outline" size="sm">
                    <Users className="h-4 w-4" aria-hidden="true" />{' '}
                    {t('featuredFreelancers.joinNow') || 'Join now'}
                  </Button>
                }
              />
            </div>
          ) : (
            freelancers.map((freelancer) => (
              <div
                key={freelancer.id}
                className="w-[280px] sm:w-[320px] shrink-0 snap-start"
              >
                <FreelancerCard freelancer={freelancer} className="h-full" />
              </div>
            ))
          )}
        </HorizontalScrollRow>
      </Container>
    </section>
  );
}

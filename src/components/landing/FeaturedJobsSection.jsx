import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import JobCard from '../marketplace/JobCard';
import HorizontalScrollRow from '../common/HorizontalScrollRow';
import { jobService } from '../../services/jobService';
import { normalizeJob } from '../../utils/jobMapper';
import { useI18n } from '../../i18n';

export default function FeaturedJobsSection() {
  const { t } = useI18n();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    jobService
      .getJobs({ page: 1 })
      .then((response) => {
        if (!active) return;
        const rawJobs = response?.data ?? (Array.isArray(response) ? response : []);
        setJobs(rawJobs.map(normalizeJob).slice(0, 8));
      })
      .catch(() => {
        // Fallback gracefully
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-gray-50 py-12 lg:py-16" aria-labelledby="featured-jobs-heading">
      <Container>
        <HorizontalScrollRow
          scrollStep={340}
          renderControls={({ controls }) => (
            <div className="mb-6 flex flex-col items-center gap-4 text-center">
              <SectionHeading
                align="center"
                eyebrow={t('featuredJobs.eyebrow') || 'Featured'}
                title={t('featuredJobs.title') || 'Latest Job Opportunities'}
                description={
                  t('featuredJobs.description') ||
                  'Hand-picked jobs from employers across Ethiopia and beyond.'
                }
              />
              <div className="flex items-center justify-center gap-3 sm:gap-4 shrink-0">
                <Link
                  to="/jobs"
                  className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  {t('featuredJobs.viewAll') || 'View All Jobs'}{' '}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                {controls}
              </div>
            </div>
          )}
        >
          <h2 id="featured-jobs-heading" className="sr-only">
            {t('featuredJobs.title') || 'Featured jobs'}
          </h2>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-56 w-[300px] sm:w-[340px] md:w-[360px] shrink-0 animate-pulse rounded-card border border-gray-200 bg-white snap-start"
              />
            ))
          ) : jobs.length === 0 ? (
            <div className="w-full rounded-card border border-dashed border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">
                {t('featuredJobs.empty') || 'No open jobs available at the moment.'}
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="w-[300px] sm:w-[340px] md:w-[360px] shrink-0 snap-start"
              >
                <JobCard job={job} savable className="h-full" />
              </div>
            ))
          )}
        </HorizontalScrollRow>
      </Container>
    </section>
  );
}

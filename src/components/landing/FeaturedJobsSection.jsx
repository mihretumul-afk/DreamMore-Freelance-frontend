import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import JobCard from '../marketplace/JobCard';
import { jobService } from '../../services/jobService';
import { normalizeJob } from '../../utils/jobMapper';

export default function FeaturedJobsSection() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    jobService
      .getJobs({ page: 1 })
      .then((response) => {
        if (!active) return;
        const rawJobs = response?.data ?? (Array.isArray(response) ? response : []);
        setJobs(rawJobs.map(normalizeJob).slice(0, 6));
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
    <section className="bg-gray-50 py-16 lg:py-24" aria-labelledby="featured-jobs-heading">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Featured"
            title="Fresh opportunities"
            description="Hand-picked jobs from employers across Ethiopia and beyond."
          />
          <Link
            to="/jobs"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Browse all jobs <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <h2 id="featured-jobs-heading" className="sr-only">
          Featured jobs
        </h2>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-card border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-10 rounded-card border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">No open jobs available at the moment.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} savable />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

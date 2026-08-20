import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import FreelancerCard from '../marketplace/FreelancerCard';
import EmptyState from '../common/EmptyState';
import Button from '../ui/Button';
import { freelancerService } from '../../services/freelancerService';

export default function FeaturedFreelancersSection() {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    freelancerService
      .getFreelancers({ page: 1, sort: 'rating' })
      .then((response) => {
        if (!active) return;
        const list = response?.data ?? [];
        setFreelancers(list.slice(0, 6));
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
    <section className="bg-white py-16 lg:py-24" aria-labelledby="featured-freelancers-heading">
      <Container>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Top talent"
            title="Meet skilled freelancers"
            description="Developers, designers, marketers, and more — ready for your next project."
          />
          <Link
            to="/freelancers"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Find talent <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <h2 id="featured-freelancers-heading" className="sr-only">
          Featured freelancers
        </h2>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-card border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : freelancers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No freelancers yet"
            description="Be the first to join the marketplace."
            action={
              <Button as={Link} to="/register" variant="outline" size="sm">
                <Users className="h-4 w-4" aria-hidden="true" /> Join now
              </Button>
            }
          />
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {freelancers.map((freelancer) => (
              <FreelancerCard key={freelancer.id} freelancer={freelancer} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

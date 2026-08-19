import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import FreelancerCard from '../marketplace/FreelancerCard';
import { SAMPLE_FREELANCERS } from '../../constants/sampleContent';

export default function FeaturedFreelancersSection() {
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

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SAMPLE_FREELANCERS.map((freelancer) => (
            <FreelancerCard key={freelancer.id} freelancer={freelancer} sample />
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Sample profiles shown as design preview — live profiles arrive with the
          freelancer discovery phase.
        </p>
      </Container>
    </section>
  );
}

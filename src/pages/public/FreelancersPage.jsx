import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import Container from '../../components/common/Container';
import PageHeader from '../../components/marketplace/PageHeader';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { usePageTitle } from '../../hooks/usePageTitle';

/**
 * Freelancer discovery listing.
 *
 * The backend currently provides a public profile endpoint
 * (GET /api/v1/freelancers/{id}) but NO discovery/listing endpoint
 * (GET /freelancers). Per the API-contract rule, this page does not invent or
 * fake a listing — it stays in a clear "coming soon" state until the backend
 * ships the discovery contract.
 */
export default function FreelancersPage() {
  usePageTitle('Find Talent');

  return (
    <Container className="py-8 lg:py-12">
      <PageHeader
        eyebrow="Marketplace"
        title="Find Talent"
        description="Discover skilled freelancers across Ethiopia — developers, designers, marketers, and more."
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Find Talent' }]}
      />

      <Card className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center px-6 py-16 text-center sm:px-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
            <Users className="h-7 w-7 text-brand-500" aria-hidden="true" />
          </div>
          <Badge tone="neutral" className="mt-5">
            Coming soon
          </Badge>
          <h2 className="mt-3 text-xl font-bold text-ink-900">Freelancer discovery is on its way</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
            The backend discovery API (<code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">GET /api/v1/freelancers</code>)
            is not available yet, so this listing cannot be wired to real data.
            Individual freelancer profiles are live — and open jobs are waiting for you.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button as={Link} to="/jobs" variant="outline">
              Browse open jobs <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Card>
    </Container>
  );
}

import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Container from '../components/common/Container';
import Button from '../components/ui/Button';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page Not Found');

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
        <Compass className="h-8 w-8 text-brand-500" aria-hidden="true" />
      </div>
      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-brand-500">404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink-900">
        This page went off the map
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
        The page you are looking for does not exist or has been moved. Let us get
        you back to the marketplace.
      </p>
      <Button as={Link} to="/" size="lg" className="mt-8">
        Back to home
      </Button>
    </Container>
  );
}

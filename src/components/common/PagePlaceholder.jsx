import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Container from './Container';
import Badge from '../ui/Badge';
import PageHeader from '../marketplace/PageHeader';

/**
 * Generic placeholder used by every route whose functionality ships in a
 * later phase. Keeps the routing architecture real without fake features and
 * gives every placeholder page the same header and layout.
 */
export default function PagePlaceholder({ icon: Icon, title, description, action, breadcrumbs, eyebrow }) {
  return (
    <Container className="py-8 lg:py-12">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
      />
      <div className="flex flex-col items-center rounded-card border border-dashed border-gray-300 bg-gray-50/60 px-6 py-20 text-center">
        {Icon && (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
            <Icon className="h-7 w-7 text-brand-500" aria-hidden="true" />
          </div>
        )}
        <Badge tone="neutral" className="mt-5">
          Foundation placeholder
        </Badge>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
          This page is part of the Dream More AppWorks roadmap and will be
          implemented in a later phase.
        </p>
        <div className="mt-6">
          {action ?? (
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
            </Link>
          )}
        </div>
      </div>
    </Container>
  );
}

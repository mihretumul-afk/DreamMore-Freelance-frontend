import { Milestone } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function MilestonesAdminPage() {
  usePageTitle('Milestones — Admin');
  const { can } = useAdminPermissions();

  if (!can('milestones.view')) {
    return (
      <EmptyState
        icon={Milestone}
        title="Access Restricted"
        description="You do not have permission to view milestones."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Milestones</h1>
        <p className="mt-0.5 text-sm text-gray-500">Milestone funding and release management.</p>
      </div>
      <EmptyState
        icon={Milestone}
        title="Coming in Stage 3"
        description="Milestone funding, release and approval workflows will be implemented in the next stage."
      />
    </div>
  );
}

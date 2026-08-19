import { ClipboardList } from 'lucide-react';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function EmployerJobsPage() {
  usePageTitle('My Jobs');

  return (
    <PagePlaceholder
      icon={ClipboardList}
      title="My Jobs"
      description="Manage your posted jobs, review proposals, and track hiring here once the jobs phase ships."
    />
  );
}

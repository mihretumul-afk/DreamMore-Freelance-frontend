import { Bell } from 'lucide-react';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function EmployerNotificationsPage() {
  usePageTitle('Notifications');

  return (
    <PagePlaceholder
      icon={Bell}
      title="Notifications"
      description="New proposals, contract updates, and messages will appear here once notifications ship."
    />
  );
}

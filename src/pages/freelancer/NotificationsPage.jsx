import { Bell } from 'lucide-react';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function FreelancerNotificationsPage() {
  usePageTitle('Notifications');

  return (
    <PagePlaceholder
      icon={Bell}
      title="Notifications"
      description="Proposal updates, contract activity, and messages will appear here once notifications ship."
    />
  );
}

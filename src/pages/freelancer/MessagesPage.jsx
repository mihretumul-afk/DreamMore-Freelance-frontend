import { MessageSquare } from 'lucide-react';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function FreelancerMessagesPage() {
  usePageTitle('Messages');

  return (
    <PagePlaceholder
      icon={MessageSquare}
      title="Messages"
      description="Conversations with employers, clients, and teams will live here once the messaging phase ships."
    />
  );
}

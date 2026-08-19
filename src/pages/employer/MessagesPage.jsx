import { MessageSquare } from 'lucide-react';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function EmployerMessagesPage() {
  usePageTitle('Messages');

  return (
    <PagePlaceholder
      icon={MessageSquare}
      title="Messages"
      description="Conversations with freelancers and candidates will live here once the messaging phase ships."
    />
  );
}

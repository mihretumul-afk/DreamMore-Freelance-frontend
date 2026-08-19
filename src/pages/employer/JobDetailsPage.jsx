import { FileText } from 'lucide-react';
import { useParams } from 'react-router-dom';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function EmployerJobDetailsPage() {
  usePageTitle('Job Details');
  const { id } = useParams();

  return (
    <PagePlaceholder
      icon={FileText}
      title="Job Details"
      description={`Full management view for job #${id ?? ''} — postings, proposals, and hiring actions — arrives with the jobs phase.`}
    />
  );
}

import { PenLine } from 'lucide-react';
import { useParams } from 'react-router-dom';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function EmployerJobEditPage() {
  usePageTitle('Edit Job');
  const { id } = useParams();

  return (
    <PagePlaceholder
      icon={PenLine}
      title="Edit Job"
      description={`Editing job #${id ?? ''} — update requirements, budget, or close the posting — arrives with the jobs phase.`}
    />
  );
}

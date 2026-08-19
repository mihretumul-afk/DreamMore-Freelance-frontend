import { PlusCircle } from 'lucide-react';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function EmployerJobCreatePage() {
  usePageTitle('Post a Job');

  return (
    <PagePlaceholder
      icon={PlusCircle}
      title="Post a Job"
      description="Create a job posting — title, description, category, skills, and budget — in the upcoming jobs phase."
    />
  );
}

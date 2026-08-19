import { Briefcase } from 'lucide-react';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function FreelancerJobsPage() {
  usePageTitle('Find Jobs');

  return (
    <PagePlaceholder
      icon={Briefcase}
      title="Find Jobs"
      description="Search and filter open jobs, then submit proposals — arriving with the jobs and proposals phases."
    />
  );
}

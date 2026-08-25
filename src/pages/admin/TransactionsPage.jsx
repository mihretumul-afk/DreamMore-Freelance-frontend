import { ArrowLeftRight } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function TransactionsPage() {
  usePageTitle('Transactions — Admin');
  const { can } = useAdminPermissions();

  if (!can('transactions.view')) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="Access Restricted"
        description="You do not have permission to view transactions."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Transactions</h1>
        <p className="mt-0.5 text-sm text-gray-500">Transaction history and export.</p>
      </div>
      <EmptyState
        icon={ArrowLeftRight}
        title="Coming in Stage 3"
        description="Transaction history, filtering and export will be implemented in the next stage."
      />
    </div>
  );
}

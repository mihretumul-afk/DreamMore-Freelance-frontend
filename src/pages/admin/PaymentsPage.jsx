import { CreditCard } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function PaymentsPage() {
  usePageTitle('Payments — Admin');
  const { can } = useAdminPermissions();

  if (!can('payments.view')) {
    return (
      <EmptyState
        icon={CreditCard}
        title="Access Restricted"
        description="You do not have permission to view payments."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Payments</h1>
        <p className="mt-0.5 text-sm text-gray-500">Payment management will be available in Stage 3.</p>
      </div>
      <EmptyState
        icon={CreditCard}
        title="Coming in Stage 3"
        description="Payment processing, verification and refund management will be implemented in the next stage."
      />
    </div>
  );
}

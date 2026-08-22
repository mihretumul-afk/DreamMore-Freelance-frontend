import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Handshake } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ContractListSkeleton } from '../../components/contracts/ContractSkeleton';
import ContractCard from '../../components/contracts/ContractCard';
import { contractService } from '../../services/contractService';
import { normalizeContract } from '../../utils/contractMapper';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function EmployerContractsPage() {
  usePageTitle('Contracts');

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await contractService.getMyContracts();
      const rawContracts = Array.isArray(res.data)
        ? res.data
        : (res.data?.data ?? (Array.isArray(res) ? res : []));
      setContracts(rawContracts.map(normalizeContract).filter(Boolean));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your contracts. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  if (loading) return <ContractListSkeleton />;

  if (error) {
    return (
      <ErrorState title="Unable to load your contracts" description={error} onRetry={loadContracts} />
    );
  }

  const activeCount = contracts.filter(
    (contract) => contract.status === 'active' || contract.status === 'paused',
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer"
        title="Contracts"
        description={
          contracts.length > 0
            ? `${contracts.length} contract${contracts.length === 1 ? '' : 's'} · ${activeCount} active`
            : 'Your contracts appear here once you accept a proposal.'
        }
        breadcrumbs={[{ label: 'Dashboard', to: '/employer/dashboard' }, { label: 'Contracts' }]}
      />

      {contracts.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={Handshake}
              title="You don't have any contracts yet"
              description="When you accept a proposal, a contract is created and will appear here with milestones to manage."
              action={
                <Button as={Link} to="/employer/jobs">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" /> Manage Jobs
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {contracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} role="employer" />
          ))}
        </div>
      )}
    </div>
  );
}

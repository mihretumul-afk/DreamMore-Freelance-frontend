import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Eye, Search, XCircle, Users } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/marketplace/Avatar';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function FreelancerApprovalPage() {
  usePageTitle('Freelancer Approvals — Admin');
  const { showToast } = useToast();

  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadFreelancers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getFreelancers({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      const data = response.data ?? response;
      setFreelancers(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load freelancers.'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadFreelancers();
  }, [loadFreelancers]);

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      await adminService.approveFreelancer(id);
      showToast('Freelancer approved successfully.', 'success');
      loadFreelancers();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to approve freelancer.'), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessingId(rejectModal.id);
    try {
      await adminService.rejectFreelancer(rejectModal.id, rejectReason);
      showToast('Freelancer rejected.', 'success');
      setRejectModal(null);
      setRejectReason('');
      loadFreelancers();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to reject freelancer.'), 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const statusColors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Freelancer Approvals</h1>
        <p className="text-sm text-gray-500">
          Review and approve freelancer accounts for marketplace visibility.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Search freelancers"
              placeholder="Search by name, email, or headline..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="">All</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Freelancers list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-card border border-gray-200 bg-white" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Unable to load freelancers" description={error} onRetry={loadFreelancers} />
      ) : freelancers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No freelancers found"
          description="No freelancers match the current filters."
        />
      ) : (
        <div className="space-y-3">
          {freelancers.map((freelancer) => (
            <Card key={freelancer.id}>
              <CardBody>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={freelancer.user?.name}
                      src={freelancer.user?.avatar}
                      size="md"
                      variant="brand"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/freelancers/${freelancer.user_id}`}
                          className="text-sm font-bold text-ink-900 hover:text-brand-600"
                        >
                          {freelancer.user?.name}
                        </Link>
                        <Badge tone={statusColors[freelancer.approval_status]} size="xs">
                          {freelancer.approval_status}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {freelancer.user?.email}
                        {freelancer.headline && ` · ${freelancer.headline}`}
                      </p>
                      {freelancer.rejection_reason && (
                        <p className="mt-1 text-xs text-red-600">
                          Reason: {freelancer.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {freelancer.approval_status === 'pending' && (
                      <>
                        <Button
                          variant="success"
                          size="sm"
                          loading={processingId === freelancer.id}
                          onClick={() => handleApprove(freelancer.id)}
                        >
                          <CheckCircle className="h-4 w-4" /> Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setRejectModal(freelancer)}
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    <Button
                      as={Link}
                      to={`/freelancers/${freelancer.user_id}`}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" /> View
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader title="Reject Freelancer" description={`Reject ${rejectModal.user?.name}'s application.`} />
            <CardBody className="space-y-4">
              <Input
                label="Rejection reason (optional)"
                placeholder="Provide a reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  loading={processingId === rejectModal.id}
                  onClick={handleReject}
                  className="flex-1"
                >
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

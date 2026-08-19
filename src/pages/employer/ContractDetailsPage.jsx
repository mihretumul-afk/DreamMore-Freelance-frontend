import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  PauseCircle,
  PlayCircle,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { ContractDetailSkeleton } from '../../components/contracts/ContractSkeleton';
import ContractHeader from '../../components/contracts/ContractHeader';
import ContractSummary from '../../components/contracts/ContractSummary';
import MilestoneList from '../../components/contracts/MilestoneList';
import MilestoneForm from '../../components/contracts/MilestoneForm';
import ConfirmActionModal from '../../components/proposals/ConfirmActionModal';
import { contractService } from '../../services/contractService';
import { milestoneService } from '../../services/milestoneService';
import { normalizeContract } from '../../utils/contractMapper';
import { milestoneFormToPayload } from '../../utils/milestoneMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatDate, formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

const CONTRACT_DIALOGS = {
  pause: {
    title: 'Pause contract?',
    description:
      'Pausing stops milestone work on this contract. You can resume it at any time.',
    confirmLabel: 'Pause Contract',
    tone: 'primary',
  },
  resume: {
    title: 'Resume contract?',
    description: 'Resuming makes the contract active again so milestones can be managed and submitted.',
    confirmLabel: 'Resume Contract',
    tone: 'success',
  },
  complete: {
    title: 'Complete contract?',
    description:
      'All milestones must be approved before a contract can be completed. Completion ends the contract and sets its end date.',
    confirmLabel: 'Complete Contract',
    tone: 'success',
  },
  cancel: {
    title: 'Cancel contract?',
    description:
      'Cancelling ends the contract. This is permanent and cannot be undone.',
    confirmLabel: 'Cancel Contract',
    tone: 'danger',
  },
};

const MILESTONE_DIALOGS = {
  approve: {
    title: 'Approve milestone?',
    description:
      'Approving marks this milestone as complete. The agreed amount is recorded as completed on the contract.',
    confirmLabel: 'Approve Milestone',
    tone: 'success',
  },
  revision: {
    title: 'Request revision?',
    description:
      'This sends the milestone back to in-progress so the freelancer can revise and resubmit it.',
    confirmLabel: 'Request Revision',
    tone: 'primary',
  },
  delete: {
    title: 'Delete milestone?',
    description:
      'Only milestones that have not started yet can be deleted. This cannot be undone.',
    confirmLabel: 'Delete Milestone',
    tone: 'danger',
  },
};

export default function EmployerContractDetailsPage() {
  usePageTitle('Contract Details');
  const { id } = useParams();

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  // Contract-level actions (pause/resume/complete/cancel).
  const [contractAction, setContractAction] = useState(null); // 'pause' | 'resume' | 'complete' | 'cancel'
  // Milestone confirm actions (approve/revision/delete) + submit handled on the freelancer side.
  const [milestoneAction, setMilestoneAction] = useState(null); // { milestone, kind }
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Milestone create/edit form.
  const [formOpen, setFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null); // milestone | null (create)
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formFieldErrors, setFormFieldErrors] = useState({});
  const [formGeneralError, setFormGeneralError] = useState(null);

  const [notice, setNotice] = useState(null);

  const loadContract = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await contractService.getContract(id);
        if (res.success) {
          setContract(normalizeContract(res.data));
        } else {
          setError(res.message || 'Contract not found.');
          setNotFound(true);
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status === 404) {
          setNotFound(true);
          setError('This contract does not exist or is no longer available.');
        } else if (status === 403) {
          setForbidden(true);
          setError(err.response.data?.message || 'You do not have access to this contract.');
        } else {
          setError(getErrorMessage(err, 'Unable to load this contract. Please try again.'));
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const openContractAction = (kind) => {
    setActionError(null);
    setContractAction(kind);
  };

  const handleContractAction = async () => {
    if (!contractAction) return;
    setActing(true);
    setActionError(null);
    try {
      const call = {
        pause: contractService.pauseContract,
        resume: contractService.resumeContract,
        complete: contractService.completeContract,
        cancel: contractService.cancelContract,
      }[contractAction];
      const res = await call(contract.id);
      setNotice(res.message || 'Contract updated.');
      setContractAction(null);
      await loadContract(true);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update this contract. Please try again.'));
      setActing(false);
    }
  };

  const openMilestoneAction = (milestone, kind) => {
    setActionError(null);
    setMilestoneAction({ milestone, kind });
  };

  const handleMilestoneAction = async () => {
    if (!milestoneAction) return;
    const { milestone, kind } = milestoneAction;
    setActing(true);
    setActionError(null);
    try {
      const call =
        kind === 'approve'
          ? milestoneService.approveMilestone
          : kind === 'revision'
            ? milestoneService.requestMilestoneRevision
            : milestoneService.deleteMilestone;
      const res = await call(contract.id, milestone.id);
      setNotice(res.message || 'Milestone updated.');
      setMilestoneAction(null);
      await loadContract(true);
    } catch (err) {
      setActionError(getErrorMessage(err, 'Unable to update this milestone. Please try again.'));
      setActing(false);
    }
  };

  const openCreateForm = () => {
    setEditingMilestone(null);
    setFormFieldErrors({});
    setFormGeneralError(null);
    setFormOpen(true);
  };

  const openEditForm = (milestone) => {
    setEditingMilestone(milestone);
    setFormFieldErrors({});
    setFormGeneralError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (formSubmitting) return;
    setFormOpen(false);
    setEditingMilestone(null);
    setFormFieldErrors({});
    setFormGeneralError(null);
  };

  const handleFormSubmit = async (form) => {
    setFormSubmitting(true);
    setFormFieldErrors({});
    setFormGeneralError(null);
    try {
      const payload = milestoneFormToPayload(form);
      if (editingMilestone) {
        const res = await milestoneService.updateMilestone(contract.id, editingMilestone.id, payload);
        setNotice(res.message || 'Milestone updated.');
      } else {
        const res = await milestoneService.createMilestone(contract.id, payload);
        setNotice(res.message || 'Milestone created.');
      }
      setFormOpen(false);
      setEditingMilestone(null);
      await loadContract(true);
    } catch (err) {
      setFormFieldErrors(getFieldErrors(err));
      const hasFieldErrors = Object.keys(getFieldErrors(err)).length > 0;
      setFormGeneralError(
        hasFieldErrors ? null : getErrorMessage(err, 'Unable to save this milestone. Please try again.'),
      );
      setFormSubmitting(false);
    }
  };

  if (loading) return <ContractDetailSkeleton />;

  if (error || !contract) {
    return (
      <ErrorState
        title={notFound ? 'Contract not found' : forbidden ? 'Access denied' : 'Unable to load this contract'}
        description={error}
        onRetry={loadContract}
      />
    );
  }

  const job = contract.job;
  const contractActive = contract.status === 'active';
  const contractPaused = contract.status === 'paused';
  const canAddMilestone = contractActive;

  const initialFormValues = editingMilestone
    ? {
        title: editingMilestone.title ?? '',
        description: editingMilestone.description ?? '',
        amount: editingMilestone.amount != null ? String(editingMilestone.amount) : '',
        dueDate: editingMilestone.dueDate ? editingMilestone.dueDate.slice(0, 10) : '',
      }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer"
        title="Contract Details"
        breadcrumbs={[
          { label: 'Contracts', to: '/employer/contracts' },
          { label: contract.title },
        ]}
      />

      {notice && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-medium text-success-700"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> {notice}
        </div>
      )}

      <ContractHeader contract={contract} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Job information */}
          <Card>
            <CardHeader title="Job" />
            <CardBody>
              {job ? (
                <>
                  <Link
                    to={`/employer/jobs/${job.id}`}
                    className="text-base font-bold text-ink-900 transition-colors hover:text-brand-600"
                  >
                    {job.title}
                  </Link>
                  <p className="mt-1 text-xs text-gray-400">
                    {job.minBudget != null && job.maxBudget != null
                      ? `Budget ${formatETB(job.minBudget)}–${formatETB(job.maxBudget)} · `
                      : ''}
                    {job.locationType && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {job.locationType === 'remote' ? 'Remote' : job.location || job.locationType}
                      </span>
                    )}
                    {job.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" aria-hidden="true" />
                        Deadline {formatDate(job.deadline)}
                      </span>
                    )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Job information is no longer available.</p>
              )}
            </CardBody>
          </Card>

          {/* Milestones */}
          <MilestoneList
            contract={contract}
            role="employer"
            busyAction={milestoneAction?.milestone.id ?? null}
            canAdd={canAddMilestone}
            onAddMilestone={openCreateForm}
            onMilestoneAction={(milestone, kind) => {
              if (kind === 'edit') {
                openEditForm(milestone);
              } else {
                openMilestoneAction(milestone, kind);
              }
            }}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <ContractSummary contract={contract} role="employer" />

          {(contractActive || contractPaused) && (
            <Card>
              <CardHeader
                title="Contract actions"
                description={
                  contractPaused
                    ? 'This contract is paused. Resume it to continue, or cancel it.'
                    : 'Manage the contract lifecycle. Status changes are applied by the server.'
                }
              />
              <CardBody className="space-y-2">
                {contractActive && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      size="sm"
                      onClick={() => openContractAction('pause')}
                    >
                      <PauseCircle className="h-4 w-4" aria-hidden="true" /> Pause Contract
                    </Button>
                    <Button
                      variant="success"
                      className="w-full"
                      size="sm"
                      onClick={() => openContractAction('complete')}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Complete Contract
                    </Button>
                  </>
                )}
                {contractPaused && (
                  <Button
                    variant="success"
                    className="w-full"
                    size="sm"
                    onClick={() => openContractAction('resume')}
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden="true" /> Resume Contract
                  </Button>
                )}
                <Button
                  variant="danger"
                  className="w-full"
                  size="sm"
                  onClick={() => openContractAction('cancel')}
                >
                  <Ban className="h-4 w-4" aria-hidden="true" /> Cancel Contract
                </Button>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardFooter>
              <Button
                as={Link}
                to="/employer/contracts"
                variant="ghost"
                className="w-full"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Contracts
              </Button>
              <Button
                as={Link}
                to="/employer/jobs"
                variant="outline"
                className="mt-2 w-full"
                size="sm"
              >
                <ClipboardList className="h-4 w-4" aria-hidden="true" /> Manage Jobs
              </Button>
            </CardFooter>
          </Card>
        </aside>
      </div>

      {/* Contract action confirmation */}
      <ConfirmActionModal
        open={Boolean(contractAction)}
        onClose={() => setContractAction(null)}
        title={contractAction ? CONTRACT_DIALOGS[contractAction].title : ''}
        description={contractAction ? CONTRACT_DIALOGS[contractAction].description : ''}
        confirmLabel={contractAction ? CONTRACT_DIALOGS[contractAction].confirmLabel : ''}
        tone={contractAction ? CONTRACT_DIALOGS[contractAction].tone : 'primary'}
        busy={acting}
        error={actionError}
        onConfirm={handleContractAction}
      />

      {/* Milestone confirm action (approve / revision / delete) */}
      <ConfirmActionModal
        open={Boolean(milestoneAction)}
        onClose={() => setMilestoneAction(null)}
        title={milestoneAction ? MILESTONE_DIALOGS[milestoneAction.kind].title : ''}
        description={milestoneAction ? MILESTONE_DIALOGS[milestoneAction.kind].description : ''}
        confirmLabel={milestoneAction ? MILESTONE_DIALOGS[milestoneAction.kind].confirmLabel : ''}
        tone={milestoneAction ? MILESTONE_DIALOGS[milestoneAction.kind].tone : 'primary'}
        busy={acting}
        error={actionError}
        onConfirm={handleMilestoneAction}
      />

      {/* Milestone create/edit form */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingMilestone ? 'Edit milestone' : 'Add milestone'}
        description={
          editingMilestone
            ? 'Only pending or in-progress milestones can be edited on an active contract.'
            : 'Break the work into paid checkpoints on this active contract.'
        }
        size="md"
      >
        {editingMilestone ? (
          <MilestoneForm
            key={editingMilestone.id}
            initialValues={initialFormValues}
            submitLabel="Save Changes"
            submitting={formSubmitting}
            fieldErrors={formFieldErrors}
            generalError={formGeneralError}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        ) : (
          <MilestoneForm
            submitting={formSubmitting}
            fieldErrors={formFieldErrors}
            generalError={formGeneralError}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        )}
      </Modal>
    </div>
  );
}

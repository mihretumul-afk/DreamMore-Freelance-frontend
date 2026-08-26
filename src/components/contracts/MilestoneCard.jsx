import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Pencil,
  RotateCcw,
  Send,
  Trash2,
  Wallet,
  XCircle,
} from 'lucide-react';
import Card, { CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import StatusBadge from '../marketplace/StatusBadge';
import MilestoneSubmissionHistory from './MilestoneSubmissionHistory';
import { formatDate, formatETB, formatCurrency } from '../../utils/format';

/** Backend-gated statuses for each action (MilestoneController rules). */
const EDITABLE_STATUSES = ['pending', 'in_progress', 'revision_requested'];
const SUBMITTABLE_STATUSES = ['pending', 'in_progress', 'revision_requested'];

/** Payment status display config */
const PAYMENT_STATUS = {
  funded:    { label: 'Funded', tone: 'info', icon: Wallet },
  disputed:  { label: 'Disputed', tone: 'danger', icon: XCircle },
  released:  { label: 'Released', tone: 'success', icon: CheckCircle2 },
  pending:   { label: 'Pending Payment', tone: 'warning', icon: Clock },
};

/**
 * Single milestone row. `onAction(milestone, action)` is raised for the
 * confirmed backend actions — submit (freelancer) and approve / revision /
 * edit / delete (employer).
 */
export default function MilestoneCard({
  milestone,
  role = 'freelancer',
  contractActive = false,
  contractId,
  busy = false,
  onAction,
}) {
  const isFreelancerView = role === 'freelancer';

  const canSubmit = isFreelancerView && contractActive && SUBMITTABLE_STATUSES.includes(milestone.status);
  const canEdit = !isFreelancerView && contractActive && EDITABLE_STATUSES.includes(milestone.status);
  const canDelete = !isFreelancerView && contractActive && milestone.status === 'pending';
  const canApprove = !isFreelancerView && contractActive && milestone.status === 'submitted';
  const canRevision = !isFreelancerView && contractActive && milestone.status === 'submitted';

  // Payment actions for employer
  const isFunded = milestone.escrowFundedAt && !milestone.paidAt;
  const isDisputed = milestone.status === 'disputed';
  const isPaid = milestone.status === 'paid' || milestone.paidAt;
  const canFund = !isFreelancerView && contractActive && !milestone.escrowFundedAt && !isPaid && !isDisputed;
  const canRelease = !isFreelancerView && contractActive && isFunded && milestone.status === 'approved' && !isDisputed;
  const canRefund = !isFreelancerView && isFunded && !isDisputed && !['submitted', 'approved', 'paid'].includes(milestone.status);

  // Determine payment status display
  const paymentStatus = isPaid ? 'released' : isDisputed ? 'disputed' : isFunded ? 'funded' : 'pending';
  const paymentMeta = PAYMENT_STATUS[paymentStatus];

  const actionButtonClass =
    'h-8 px-2.5 text-xs disabled:pointer-events-none disabled:opacity-50';

  const isResubmission = milestone.status === 'revision_requested';

  return (
    <Card variant="bordered">
      <CardBody>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-ink-900">{milestone.title}</p>
              <StatusBadge status={milestone.status} size="xs" />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="font-semibold text-brand-600">{formatETB(milestone.amount)}</span>
              {milestone.dueDate && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  Due {formatDate(milestone.dueDate)}
                </span>
              )}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            {canSubmit && (
              <Button
                variant="primary"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => onAction?.(milestone, 'submit')}
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />{' '}
                {isResubmission ? 'Resubmit Work' : 'Submit Work'}
              </Button>
            )}
            {canEdit && (
              <Button
                variant="outline"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => onAction?.(milestone, 'edit')}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="danger"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => onAction?.(milestone, 'delete')}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
              </Button>
            )}
            {canApprove && (
              <Button
                variant="success"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => onAction?.(milestone, 'approve')}
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Approve
              </Button>
            )}
            {canRevision && (
              <Button
                variant="outline"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => onAction?.(milestone, 'revision')}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Request Revision
              </Button>
            )}
          </div>
        </div>

        {milestone.description && (
          <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-gray-500">
            {milestone.description}
          </p>
        )}

        {/* Payment status badge */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          <Badge tone={paymentMeta.tone} size="xs">
            <paymentMeta.icon className="h-2.5 w-2.5" aria-hidden="true" /> {paymentMeta.label}
          </Badge>
          {isFunded && (
            <span className="text-[11px] text-gray-400">
              Funds held in escrow — released upon approval
            </span>
          )}
          {isPaid && (
            <span className="text-[11px] text-success-600">
              Payment of {formatCurrency(parseFloat(milestone.amount))} released to freelancer
            </span>
          )}
          {isDisputed && (
            <span className="text-[11px] text-danger-600">
              Payment frozen — dispute under review
            </span>
          )}
        </div>

        {/* Employer payment actions */}
        {!isFreelancerView && contractActive && (
          <div className="mt-3 flex flex-wrap gap-2">
            {canFund && (
              <Button
                variant="primary"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => onAction?.(milestone, 'fund')}
              >
                <Wallet className="h-3.5 w-3.5" aria-hidden="true" /> Fund Milestone
              </Button>
            )}
            {canRelease && (
              <Button
                variant="success"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => onAction?.(milestone, 'release')}
              >
                <CreditCard className="h-3.5 w-3.5" aria-hidden="true" /> Release Payment
              </Button>
            )}
            {canRefund && (
              <Button
                variant="outline"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => onAction?.(milestone, 'refund')}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Request Refund
              </Button>
            )}
          </div>
        )}

        {(milestone.submittedAt || milestone.approvedAt) && (
          <p className="mt-2 text-[11px] text-gray-400">
            {milestone.submittedAt && `Submitted ${formatDate(milestone.submittedAt)}`}
            {milestone.approvedAt && ` · Approved ${formatDate(milestone.approvedAt)}`}
          </p>
        )}

        {/* Deliverable Submissions & Revision History */}
        {milestone.submissions && milestone.submissions.length > 0 && (
          <MilestoneSubmissionHistory
            contractId={contractId || milestone.contractId}
            milestone={milestone}
            submissions={milestone.submissions}
          />
        )}
      </CardBody>
    </Card>
  );
}

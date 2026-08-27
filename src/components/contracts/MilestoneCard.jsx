import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  PlayCircle,
  Wallet,
  XCircle,
  Send,
  Pencil,
  RotateCcw,
  Trash2,
  Hourglass,
} from 'lucide-react';
import Card, { CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import StatusBadge from '../marketplace/StatusBadge';
import MilestoneSubmissionHistory from './MilestoneSubmissionHistory';
import MilestoneAttachmentPreview from './MilestoneAttachmentPreview';
import { formatDate, formatETB, formatCurrency } from '../../utils/format';

/** Milestone status constants matching the backend. */
const STATUS = {
  AWAITING_FUNDING: 'awaiting_funding',
  FUNDED: 'funded',
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  REVISION_REQUESTED: 'revision_requested',
  APPROVED: 'approved',
  RELEASED: 'released',
  PAID: 'paid',
  DISPUTED: 'disputed',
  CANCELLED: 'cancelled',
};

/** Backend-gated statuses for each action. */
const EDITABLE_STATUSES = [STATUS.AWAITING_FUNDING, STATUS.IN_PROGRESS, STATUS.REVISION_REQUESTED];
const SUBMITTABLE_STATUSES = [STATUS.IN_PROGRESS, STATUS.REVISION_REQUESTED];

/** Payment status display config */
const PAYMENT_STATUS = {
  awaiting_funding: { label: 'Awaiting Funding', tone: 'warning', icon: Hourglass },
  funded:           { label: 'Funded — Escrow', tone: 'info', icon: Wallet },
  in_progress:      { label: 'In Progress', tone: 'info', icon: Clock },
  submitted:        { label: 'Submitted', tone: 'warning', icon: Send },
  approved:         { label: 'Approved', tone: 'success', icon: CheckCircle2 },
  released:         { label: 'Released', tone: 'success', icon: CheckCircle2 },
  paid:             { label: 'Paid', tone: 'success', icon: CheckCircle2 },
  disputed:         { label: 'Disputed', tone: 'danger', icon: XCircle },
};

/**
 * Single milestone row with role-appropriate actions and funding workflow.
 *
 * Flow for freelancers:
 *   awaiting_funded → (waiting) → funded → (start work) → in_progress → (submit) → submitted
 *
 * Flow for employers:
 *   awaiting_funded → (fund) → funded → ... → approved → (release) → released
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

  // ── Freelancer actions ──────────────────────────────────────────
  const canSubmit = isFreelancerView && contractActive && SUBMITTABLE_STATUSES.includes(milestone.status);
  const canStartWork = isFreelancerView && contractActive && milestone.status === STATUS.FUNDED && milestone.isFunded;

  // ── Employer actions ────────────────────────────────────────────
  const canEdit = !isFreelancerView && contractActive && EDITABLE_STATUSES.includes(milestone.status);
  const canDelete = !isFreelancerView && contractActive && milestone.status === STATUS.AWAITING_FUNDING;
  const canApprove = !isFreelancerView && contractActive && milestone.status === STATUS.SUBMITTED;
  const canRevision = !isFreelancerView && contractActive && milestone.status === STATUS.SUBMITTED;

  // Payment actions for employer
  const isFunded = milestone.isFunded || (milestone.escrowFundedAt && !milestone.paidAt);
  const isDisputed = milestone.status === STATUS.DISPUTED;
  const isPaid = milestone.status === STATUS.PAID || milestone.status === STATUS.RELEASED || milestone.paidAt;
  const canFund = !isFreelancerView && contractActive && milestone.status === STATUS.AWAITING_FUNDING && !isPaid && !isDisputed;
  const canRelease = !isFreelancerView && contractActive && isFunded && milestone.status === STATUS.APPROVED && !isDisputed;
  const canRefund = !isFreelancerView && isFunded && !isDisputed && ![STATUS.SUBMITTED, STATUS.APPROVED, STATUS.PAID, STATUS.RELEASED].includes(milestone.status);

  // Determine payment status display
  const paymentStatus = milestone.status;
  const paymentMeta = PAYMENT_STATUS[paymentStatus] || PAYMENT_STATUS[STATUS.AWAITING_FUNDING];

  const actionButtonClass = 'h-8 px-2.5 text-xs disabled:pointer-events-none disabled:opacity-50';
  const isResubmission = milestone.status === STATUS.REVISION_REQUESTED;

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
            {/* Freelancer: Start Work button (only when funded) */}
            {canStartWork && (
              <Button
                variant="success"
                className={actionButtonClass}
                disabled={busy}
                onClick={() => onAction?.(milestone, 'startWork')}
              >
                <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" /> Start Work
              </Button>
            )}

            {/* Freelancer: Submit/Resubmit button */}
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

            {/* Employer: Edit */}
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

            {/* Employer: Delete */}
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

            {/* Employer: Approve */}
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

            {/* Employer: Request Revision */}
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

        {/* Description */}
        {milestone.description && (
          <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-gray-500">
            {milestone.description}
          </p>
        )}

        {/* Employer Attachments */}
        {milestone.attachments && milestone.attachments.length > 0 && (
          <div className="mt-3">
            <MilestoneAttachmentPreview
              attachments={milestone.attachments}
              title="Attachments"
              compact
              onDownload={async (att) => {
                const link = document.createElement('a');
                link.href = att.download_url;
                link.download = att.original_filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            />
          </div>
        )}

        {/* ── Freelancer: Waiting for Funding message ──────────────── */}
        {isFreelancerView && milestone.status === STATUS.AWAITING_FUNDING && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
            <div className="flex items-start gap-2.5">
              <Hourglass className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-amber-900">Waiting for employer funding</p>
                <p className="mt-0.5 text-xs text-amber-700">
                  The employer must fund this milestone before you can start working.
                  You'll be notified when funds are secured.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Freelancer: Ready to Start message ──────────────────── */}
        {isFreelancerView && milestone.status === STATUS.FUNDED && (
          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
            <div className="flex items-start gap-2.5">
              <Wallet className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold text-blue-900">Milestone funded — Ready to start!</p>
                <p className="mt-0.5 text-xs text-blue-700">
                  The employer has secured {formatETB(milestone.amount)} in escrow.
                  Click "Start Work" to begin working on this milestone.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Payment status badge ─────────────────────────────────── */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          <Badge tone={paymentMeta.tone} size="xs">
            <paymentMeta.icon className="h-2.5 w-2.5" aria-hidden="true" /> {paymentMeta.label}
          </Badge>
          {isFunded && milestone.status !== STATUS.AWAITING_FUNDING && (
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

        {/* ── Employer payment actions ──────────────────────────────── */}
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

        {/* ── Timeline timestamps ──────────────────────────────────── */}
        {(milestone.startedAt || milestone.submittedAt || milestone.approvedAt) && (
          <p className="mt-2 text-[11px] text-gray-400">
            {milestone.startedAt && `Started ${formatDate(milestone.startedAt)}`}
            {milestone.submittedAt && `${milestone.startedAt ? ' · ' : ''}Submitted ${formatDate(milestone.submittedAt)}`}
            {milestone.approvedAt && ` · Approved ${formatDate(milestone.approvedAt)}`}
          </p>
        )}

        {/* ── Deliverable Submissions & Revision History ───────────── */}
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

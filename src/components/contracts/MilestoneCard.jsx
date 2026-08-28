import { forwardRef } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  GripVertical,
  PlayCircle,
  Wallet,
  XCircle,
  Send,
  Pencil,
  RotateCcw,
  Trash2,
  Hourglass,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card, { CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import StatusBadge from '../marketplace/StatusBadge';
import MilestoneSubmissionHistory from './MilestoneSubmissionHistory';
import MilestoneAttachmentPreview from './MilestoneAttachmentPreview';
import { formatDate, formatETB, formatCurrency } from '../../utils/format';
import { cn } from '../../utils/cn';

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

/** Enhanced status display configuration with colors, gradients, and animations */
const STATUS_CONFIG = {
  awaiting_funding: {
    label: 'Awaiting Funding',
    tone: 'warning',
    icon: Hourglass,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-l-amber-400',
    text: 'text-amber-700',
    glow: 'shadow-amber-500/20',
    step: 1,
  },
  funded: {
    label: 'Funded — Escrow',
    tone: 'info',
    icon: Wallet,
    gradient: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
    border: 'border-l-blue-400',
    text: 'text-blue-700',
    glow: 'shadow-blue-500/20',
    step: 2,
  },
  in_progress: {
    label: 'In Progress',
    tone: 'info',
    icon: Clock,
    gradient: 'from-indigo-500 to-purple-500',
    bg: 'bg-indigo-50',
    border: 'border-l-indigo-400',
    text: 'text-indigo-700',
    glow: 'shadow-indigo-500/20',
    step: 3,
  },
  submitted: {
    label: 'Submitted',
    tone: 'warning',
    icon: Send,
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50',
    border: 'border-l-purple-400',
    text: 'text-purple-700',
    glow: 'shadow-purple-500/20',
    step: 4,
  },
  revision_requested: {
    label: 'Revision Requested',
    tone: 'warning',
    icon: RotateCcw,
    gradient: 'from-orange-500 to-red-500',
    bg: 'bg-orange-50',
    border: 'border-l-orange-400',
    text: 'text-orange-700',
    glow: 'shadow-orange-500/20',
    step: 4,
  },
  approved: {
    label: 'Approved',
    tone: 'success',
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-400',
    text: 'text-emerald-700',
    glow: 'shadow-emerald-500/20',
    step: 5,
  },
  released: {
    label: 'Released',
    tone: 'success',
    icon: CheckCircle2,
    gradient: 'from-green-500 to-emerald-500',
    bg: 'bg-green-50',
    border: 'border-l-green-400',
    text: 'text-green-700',
    glow: 'shadow-green-500/20',
    step: 6,
  },
  paid: {
    label: 'Paid',
    tone: 'success',
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-400',
    text: 'text-emerald-700',
    glow: 'shadow-emerald-500/20',
    step: 6,
  },
  disputed: {
    label: 'Disputed',
    tone: 'danger',
    icon: XCircle,
    gradient: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    border: 'border-l-red-400',
    text: 'text-red-700',
    glow: 'shadow-red-500/20',
    step: 4,
  },
  cancelled: {
    label: 'Cancelled',
    tone: 'danger',
    icon: XCircle,
    gradient: 'from-gray-400 to-gray-500',
    bg: 'bg-gray-50',
    border: 'border-l-gray-400',
    text: 'text-gray-700',
    glow: 'shadow-gray-500/20',
    step: 0,
  },
};

/** Milestone progress steps for the mini stepper */
const PROGRESS_STEPS = [
  { key: 'created', label: 'Created' },
  { key: 'funded', label: 'Funded' },
  { key: 'in_progress', label: 'Working' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'approved', label: 'Approved' },
];

/** Get the active step index based on milestone status */
function getActiveStep(status) {
  const stepMap = {
    awaiting_funding: 0,
    funded: 1,
    in_progress: 2,
    submitted: 3,
    revision_requested: 3,
    approved: 4,
    released: 4,
    paid: 4,
    disputed: 3,
    cancelled: -1,
  };
  return stepMap[status] ?? 0;
}

/** Mini progress stepper component */
function MilestoneStepper({ status }) {
  const activeStep = getActiveStep(status);
  const isTerminal = ['approved', 'released', 'paid', 'cancelled'].includes(status);

  return (
    <div className="flex items-center gap-1">
      {PROGRESS_STEPS.map((step, index) => {
        const isCompleted = index < activeStep || (isTerminal && status !== 'cancelled');
        const isActive = index === activeStep;

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-all duration-300',
                isCompleted
                  ? 'bg-emerald-500'
                  : isActive
                    ? 'bg-brand-500 animate-pulse'
                    : 'bg-gray-200',
              )}
              title={step.label}
            />
            {index < PROGRESS_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-2 sm:w-3 rounded-full transition-all duration-300',
                  index < activeStep ? 'bg-emerald-300' : 'bg-gray-200',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Drag handle component */
function DragHandle({ isDragging, listeners, attributes }) {
  return (
    <div
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 cursor-grab active:cursor-grabbing',
        isDragging
          ? 'bg-brand-100 text-brand-600 shadow-lg'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600',
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4" />
    </div>
  );
}

/**
 * Enhanced MilestoneCard with visual status indicators, step progress,
 * drag-to-reorder handle, and modern card design.
 */
const MilestoneCard = forwardRef(function MilestoneCard(
  {
    milestone,
    role = 'freelancer',
    contractActive = false,
    contractId,
    busy = false,
    onAction,
    dragEnabled = false,
  },
  ref,
) {
  const isFreelancerView = role === 'freelancer';

  // ── Drag and Drop ──────────────────────────────────────────────
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: milestone.id, disabled: !dragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

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
  const statusConfig = STATUS_CONFIG[milestone.status] || STATUS_CONFIG[STATUS.AWAITING_FUNDING];
  const StatusIcon = statusConfig.icon;

  const actionButtonClass = 'h-8 px-2.5 text-xs disabled:pointer-events-none disabled:opacity-50';
  const isResubmission = milestone.status === STATUS.REVISION_REQUESTED;

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        if (ref) {
          if (typeof ref === 'function') ref(node);
          else ref.current = node;
        }
      }}
      style={style}
      className={cn(
        'group relative',
        isDragging && 'z-50',
      )}
    >
      <Card
        variant="bordered"
        className={cn(
          'relative overflow-hidden border-l-4 transition-all duration-300',
          statusConfig.border,
          isDragging && 'shadow-2xl ring-2 ring-brand-500/30',
          !isDragging && 'hover:shadow-lg',
        )}
      >
        {/* Subtle gradient overlay for active statuses */}
        <div
          className={cn(
            'absolute inset-0 opacity-[0.03] pointer-events-none bg-gradient-to-r',
            statusConfig.gradient,
          )}
        />

        <CardBody className="relative">
          {/* Top Row: Drag Handle + Title + Status */}
          <div className="flex items-start gap-3">
            {/* Drag Handle (only for employer on active contracts) */}
            {dragEnabled && (
              <DragHandle
                isDragging={isDragging}
                listeners={listeners}
                attributes={attributes}
              />
            )}

            {/* Milestone Number Badge */}
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                statusConfig.bg,
                statusConfig.text,
              )}
            >
              {milestone.sortOrder ?? milestone.id}
            </div>

            {/* Title & Description */}
            <div className="flex-1 min-w-0">
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

              {/* Mini Progress Stepper */}
              <div className="mt-2">
                <MilestoneStepper status={milestone.status} />
              </div>
            </div>

            {/* Status Icon Badge */}
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
                statusConfig.gradient,
                statusConfig.glow,
              )}
            >
              <StatusIcon className="h-5 w-5" />
            </div>
          </div>

          {/* Description */}
          {milestone.description && (
            <div className="mt-3 ml-11">
              <p className="whitespace-pre-line text-xs leading-relaxed text-gray-500">
                {milestone.description}
              </p>
            </div>
          )}

          {/* Employer Attachments */}
          {milestone.attachments && milestone.attachments.length > 0 && (
            <div className="mt-3 ml-11">
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

          {/* ── Status-Specific Messages ────────────────────────────── */}
          {isFreelancerView && milestone.status === STATUS.AWAITING_FUNDING && (
            <div className="mt-3 ml-11 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <Hourglass className="h-4 w-4 text-amber-600" />
                </div>
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

          {isFreelancerView && milestone.status === STATUS.FUNDED && (
            <div className="mt-3 ml-11 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                  <Wallet className="h-4 w-4 text-blue-600" />
                </div>
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

          {milestone.status === STATUS.REVISION_REQUESTED && (
            <div className="mt-3 ml-11 rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-orange-900">Revision requested</p>
                  <p className="mt-0.5 text-xs text-orange-700">
                    The employer has requested changes. Please review the feedback and resubmit your work.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Action Buttons ──────────────────────────────────────── */}
          <div className="mt-4 ml-11 flex flex-wrap items-center gap-2">
            {/* Freelancer: Start Work */}
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

            {/* Freelancer: Submit/Resubmit */}
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

            {/* Raise Dispute */}
            {contractActive && !isDisputed && [STATUS.FUNDED, STATUS.IN_PROGRESS, STATUS.SUBMITTED].includes(milestone.status) && (
              <Button
                variant="outline"
                className={`${actionButtonClass} text-danger-600 border-danger-200 hover:bg-danger-50`}
                disabled={busy}
                onClick={() => onAction?.(milestone, 'dispute')}
              >
                <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> Raise Dispute
              </Button>
            )}
          </div>

          {/* ── Employer Payment Actions ──────────────────────────────── */}
          {!isFreelancerView && contractActive && (canFund || canRelease || canRefund) && (
            <div className="mt-3 ml-11 flex flex-wrap gap-2">
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

          {/* ── Payment Status Badge ─────────────────────────────────── */}
          <div className="mt-3 ml-11 flex items-center gap-2 flex-wrap">
            <Badge tone={statusConfig.tone} size="xs">
              <StatusIcon className="h-2.5 w-2.5" aria-hidden="true" /> {statusConfig.label}
            </Badge>
            {isFunded && milestone.status !== STATUS.AWAITING_FUNDING && (
              <span className="text-[11px] text-gray-400">
                Funds held in escrow — released upon approval
              </span>
            )}
            {isPaid && (
              <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Payment of {formatCurrency(parseFloat(milestone.amount))} released to freelancer
              </span>
            )}
            {isDisputed && (
              <span className="text-[11px] text-red-600">
                Payment frozen — dispute under review
              </span>
            )}
          </div>

          {/* ── Timeline Timestamps ──────────────────────────────────── */}
          {(milestone.startedAt || milestone.submittedAt || milestone.approvedAt) && (
            <div className="mt-3 ml-11 flex items-center gap-3 text-[11px] text-gray-400">
              {milestone.startedAt && (
                <span className="flex items-center gap-1">
                  <PlayCircle className="h-3 w-3" /> Started {formatDate(milestone.startedAt)}
                </span>
              )}
              {milestone.submittedAt && (
                <span className="flex items-center gap-1">
                  <Send className="h-3 w-3" /> Submitted {formatDate(milestone.submittedAt)}
                </span>
              )}
              {milestone.approvedAt && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Approved {formatDate(milestone.approvedAt)}
                </span>
              )}
            </div>
          )}

          {/* ── Deliverable Submissions & Revision History ───────────── */}
          {milestone.submissions && milestone.submissions.length > 0 && (
            <div className="mt-3 ml-11">
              <MilestoneSubmissionHistory
                contractId={contractId || milestone.contractId}
                milestone={milestone}
                submissions={milestone.submissions}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
});

export default MilestoneCard;

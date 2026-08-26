import Badge from '../ui/Badge';

/**
 * Payment status → tone + label mapping.
 * Mirrors the backend Payment::STATUS_* constants.
 */
const STATUS_META = {
  pending:    { tone: 'warning', label: 'Pending' },
  processing: { tone: 'info',    label: 'Processing' },
  completed:  { tone: 'success', label: 'Completed' },
  failed:     { tone: 'danger',  label: 'Failed' },
  refunded:   { tone: 'neutral', label: 'Refunded' },
  cancelled:  { tone: 'neutral', label: 'Cancelled' },
  disputed:   { tone: 'danger',  label: 'Disputed' },
};

/**
 * Payment type → human-readable label.
 * Mirrors Payment::TYPE_* constants.
 */
const TYPE_META = {
  escrow_funded:      { label: 'Escrow Funded',     tone: 'info' },
  milestone_released: { label: 'Milestone Released', tone: 'success' },
  refund:             { label: 'Refund',             tone: 'warning' },
  platform_fee:       { label: 'Platform Fee',       tone: 'neutral' },
  manual_adjustment:  { label: 'Adjustment',         tone: 'neutral' },
};

/**
 * PaymentStatusBadge — renders a colored badge for a payment status string.
 *
 * @param {{ status: string, size?: 'xs'|'md', dot?: boolean }} props
 */
export function PaymentStatusBadge({ status, size = 'xs', dot = true }) {
  const meta = STATUS_META[status] ?? { tone: 'neutral', label: status ?? '—' };
  return (
    <Badge tone={meta.tone} size={size} dot={dot}>
      {meta.label}
    </Badge>
  );
}

/**
 * PaymentTypeBadge — renders a colored badge for a payment type string.
 *
 * @param {{ type: string, size?: 'xs'|'md' }} props
 */
export function PaymentTypeBadge({ type, size = 'xs' }) {
  const meta = TYPE_META[type] ?? { tone: 'neutral', label: type ?? '—' };
  return (
    <Badge tone={meta.tone} size={size}>
      {meta.label}
    </Badge>
  );
}

/**
 * DirectionBadge — credit (green ↑) or debit (red ↓).
 */
export function DirectionBadge({ direction, size = 'xs' }) {
  const isCredit = direction === 'credit';
  return (
    <Badge tone={isCredit ? 'success' : 'danger'} size={size}>
      {isCredit ? '↑ Credit' : '↓ Debit'}
    </Badge>
  );
}

export default PaymentStatusBadge;

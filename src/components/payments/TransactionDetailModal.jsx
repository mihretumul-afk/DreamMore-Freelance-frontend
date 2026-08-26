import Modal from '../ui/Modal';
import { PaymentStatusBadge, PaymentTypeBadge, DirectionBadge } from './PaymentStatusBadge';
import { formatCurrency, formatDate, timeAgo } from '../../utils/format';
import { cn } from '../../utils/cn';

/**
 * TransactionDetailModal — shows full details of a single transaction.
 * Used in both user and admin views.
 */
export default function TransactionDetailModal({ transaction: txn, onClose }) {
  if (!txn) return null;

  const currency = txn.currency ?? 'ETB';
  const isCredit = txn.direction === 'credit';
  const payment  = txn.payment;

  const rows = [
    { label: 'Transaction ID',   value: txn.reference ?? `#${txn.id}` },
    { label: 'Date',             value: formatDate(txn.created_at) + (txn.created_at ? ` · ${timeAgo(txn.created_at)}` : '') },
    { label: 'Type',             value: <PaymentTypeBadge type={txn.type} size="xs" /> },
    { label: 'Direction',        value: <DirectionBadge direction={txn.direction} size="xs" /> },
    { label: 'Amount',           value: <span className={cn('font-bold', isCredit ? 'text-success-600' : 'text-danger-600')}>{isCredit ? '+' : '−'}{formatCurrency(txn.amount, currency)}</span> },
    { label: 'Platform Fee',     value: txn.fee > 0 ? formatCurrency(txn.fee, currency) : '—' },
    { label: 'Status',           value: <PaymentStatusBadge status={txn.status} size="xs" /> },
    { label: 'Description',      value: txn.description ?? '—' },
    { label: 'Payment Ref',      value: payment?.reference ?? '—' },
    { label: 'Payment Method',   value: payment?.paymentMethod?.display_label ?? '—' },
    { label: 'Related Contract', value: txn.contract?.title ?? '—' },
    { label: 'Related Milestone',value: txn.milestone?.title ?? '—' },
  ];

  return (
    <Modal open={!!txn} onClose={onClose} title="Transaction Details" size="md">
      <div className="space-y-4">
        {/* Amount hero */}
        <div className={cn(
          'rounded-xl p-4 text-center',
          isCredit ? 'bg-success-50 border border-success-200' : 'bg-danger-50 border border-danger-200',
        )}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            {isCredit ? 'Amount Received' : 'Amount Spent'}
          </p>
          <p className={cn('text-3xl font-extrabold', isCredit ? 'text-success-600' : 'text-danger-600')}>
            {isCredit ? '+' : '−'}{formatCurrency(txn.amount, currency)}
          </p>
        </div>

        {/* Detail rows */}
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 px-4 py-2.5">
              <span className="shrink-0 text-xs font-semibold text-gray-400 min-w-32">{label}</span>
              <span className="text-sm text-ink-900 text-right">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

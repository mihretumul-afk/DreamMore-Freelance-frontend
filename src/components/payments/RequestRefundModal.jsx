import { useState } from 'react';
import {
  RotateCcw, AlertCircle, Info,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import { formatCurrency } from '../../utils/format';

/**
 * RequestRefundModal — employer requests a refund on a funded milestone.
 *
 * Shows what the refund covers, requires a reason, and explains
 * the refund review process.
 */
export default function RequestRefundModal({
  open,
  onClose,
  milestone,
  payment,
  submitting = false,
  error = null,
  onConfirm,
}) {
  const [reason, setReason] = useState('');

  if (!milestone || !payment) return null;

  const amount = parseFloat(payment.amount) || parseFloat(milestone.amount) || 0;

  const handleSubmit = () => {
    if (reason.trim().length < 10) return;
    onConfirm({ reason: reason.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request Refund"
      description="Request a refund for this milestone payment."
      size="md"
    >
      <div className="space-y-5">
        {/* Milestone info */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink-900">{milestone.title}</p>
            <p className="text-sm font-bold text-danger-600">{formatCurrency(amount)}</p>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Payment Reference: {payment.reference || '—'}
          </p>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 rounded-xl border border-warning-200 bg-warning-50 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" />
          <div className="text-xs text-warning-800 space-y-1">
            <p className="font-semibold">Refund Policy</p>
            <ul className="list-disc list-inside space-y-0.5 text-warning-700">
              <li>Refund requests are reviewed by an administrator</li>
              <li>Refunds are NOT automatic — admin approval is required</li>
              <li>Refunds cannot be requested if work has already been submitted for review</li>
              <li>Processing may take 1-3 business days after approval</li>
            </ul>
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-900">
            Reason for Refund Request <span className="text-danger-500">*</span>
          </label>
          <Textarea
            placeholder="Please explain why you are requesting a refund. Be as detailed as possible (minimum 10 characters)."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            error={reason.length > 0 && reason.length < 10 ? 'Please provide at least 10 characters.' : undefined}
          />
          <p className="mt-1 text-xs text-gray-400">
            {reason.length}/1000 characters
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={submitting}
            onClick={handleSubmit}
            disabled={reason.trim().length < 10}
          >
            <RotateCcw className="h-4 w-4" />
            Submit Refund Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}

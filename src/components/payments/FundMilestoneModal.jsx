import { useState } from 'react';
import {
  Wallet, CreditCard, AlertCircle, CheckCircle2, Info,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatCurrency } from '../../utils/format';

const FEE_RATE = 0.05; // 5% platform fee

/**
 * FundMilestoneModal — confirmation screen before employer funds a milestone.
 *
 * Shows:
 * - Milestone title and description
 * - Amount breakdown (amount, platform fee, total)
 * - Selected payment method
 * - Explanation of what happens to the money
 */
export default function FundMilestoneModal({
  open,
  onClose,
  milestone,
  paymentMethod,
  submitting = false,
  error = null,
  onConfirm,
}) {
  if (!milestone) return null;

  const amount = parseFloat(milestone.amount) || 0;
  const fee = Math.round(amount * FEE_RATE * 100) / 100;
  const total = amount; // Total charged to employer is the full amount

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Fund Milestone"
      description="Review the payment details before confirming."
      size="md"
    >
      <div className="space-y-5">
        {/* Milestone info */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-sm font-bold text-ink-900">{milestone.title}</p>
          {milestone.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{milestone.description}</p>
          )}
        </div>

        {/* Amount breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Payment Breakdown
          </h4>
          <div className="rounded-xl border border-gray-100 bg-white divide-y divide-gray-100">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-gray-600">Milestone Amount</span>
              <span className="text-sm font-semibold text-ink-900">
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-600">Platform Fee (5%)</span>
                <div className="group relative">
                  <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap">
                      Platform fee covers payment processing and escrow services
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-ink-900">
                {formatCurrency(fee)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <span className="text-sm font-bold text-ink-900">Total Charged</span>
              <span className="text-base font-bold text-brand-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment method */}
        {paymentMethod && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-gray-400">
              Payment Method
            </h4>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                <CreditCard className="h-4 w-4 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {paymentMethod.display_label || paymentMethod.nickname || 'Payment Method'}
                </p>
                <p className="text-xs text-gray-400">
                  {paymentMethod.type === 'card'
                    ? `Card ending in ${paymentMethod.card_last_four || '****'}`
                    : paymentMethod.type === 'bank_account'
                    ? paymentMethod.bank_name || 'Bank Account'
                    : paymentMethod.mobile_provider || 'Mobile Money'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What happens next */}
        <div className="rounded-xl border border-info-200 bg-info-50 p-4">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-info-600" />
            <div className="text-xs text-info-800 space-y-1">
              <p className="font-semibold">What happens to your money?</p>
              <ul className="list-disc list-inside space-y-0.5 text-info-700">
                <li>Your payment of {formatCurrency(total)} will be charged immediately</li>
                <li>Funds are held securely in escrow (not released to the freelancer yet)</li>
                <li>Freelancer submits work → You review and approve</li>
                <li>Only after your approval are funds released to the freelancer</li>
                <li>You can request a refund if the milestone hasn't been submitted for review</li>
              </ul>
            </div>
          </div>
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
            variant="success"
            loading={submitting}
            onClick={onConfirm}
          >
            <Wallet className="h-4 w-4" />
            Fund Milestone — {formatCurrency(total)}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import { useState } from 'react';
import { Send, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';

/** Backend error field name → form state key. */
const ERROR_FIELD_MAP = {
  cover_letter: 'coverLetter',
  bid_amount: 'bidAmount',
  currency: 'currency',
  estimated_duration: 'estimatedDuration',
};

const EMPTY_FORM = { coverLetter: '', bidAmount: '', currency: 'ETB', estimatedDuration: '' };

/**
 * Proposal form (submit + edit). Only confirmed ProposalRequest fields:
 * cover_letter, bid_amount, currency, estimated_duration.
 *
 * Mount it fresh per proposal/job (use `key` from the parent) so initialValues
 * are captured on mount. `fieldErrors` are passed with BACKEND keys and mapped
 * here — parent pages pass the raw `getFieldErrors()` result.
 */
export default function ProposalForm({
  initialValues,
  submitLabel = 'Submit Proposal',
  submitting = false,
  fieldErrors = {},
  generalError,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...initialValues }));
  const [clientErrors, setClientErrors] = useState({});

  // Map backend validation errors (cover_letter, bid_amount, …) to display keys.
  const backendErrors = {};
  Object.entries(fieldErrors).forEach(([backendField, message]) => {
    const key = ERROR_FIELD_MAP[backendField];
    if (key) backendErrors[key] = message;
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.coverLetter.trim()) {
      errs.coverLetter = 'A cover letter is required.';
    }
    if (!form.bidAmount || Number(form.bidAmount) < 1) {
      errs.bidAmount = 'Enter a bid amount of at least 1.';
    } else if (Number(form.bidAmount) > 99999999.99) {
      errs.bidAmount = 'Bid amount is too large.';
    }
    if (!form.estimatedDuration.trim()) {
      errs.estimatedDuration = 'Estimated duration is required.';
    }
    if (form.currency && form.currency.trim().length !== 3) {
      errs.currency = 'Currency must be a 3-letter code (e.g. ETB).';
    }
    return errs;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitting) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setClientErrors(errs);
      return;
    }
    onSubmit?.(form);
  };

  const displayError = (key) => clientErrors[key] || backendErrors[key];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {generalError && (
        <div
          role="alert"
          className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
        >
          {generalError}
        </div>
      )}

      <Textarea
        label="Cover letter"
        name="coverLetter"
        rows={6}
        maxLength={5000}
        placeholder="Introduce yourself and explain why you are a great fit for this job…"
        value={form.coverLetter}
        onChange={handleChange}
        error={displayError('coverLetter')}
        disabled={submitting}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
        <Input
          type="number"
          label="Bid amount"
          name="bidAmount"
          placeholder="0.00"
          min="1"
          max="99999999.99"
          step="0.01"
          value={form.bidAmount}
          onChange={handleChange}
          error={displayError('bidAmount')}
          hint="Your proposed price for this job."
          disabled={submitting}
          required
        />
        <Input
          label="Currency"
          name="currency"
          placeholder="ETB"
          maxLength={3}
          value={form.currency}
          onChange={handleChange}
          error={displayError('currency')}
          hint="3-letter code"
          disabled={submitting}
        />
      </div>

      <Input
        label="Estimated duration"
        name="estimatedDuration"
        placeholder="e.g. 2 weeks, 3 months"
        maxLength={255}
        value={form.estimatedDuration}
        onChange={handleChange}
        error={displayError('estimatedDuration')}
        disabled={submitting}
        required
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            <X className="h-4 w-4" aria-hidden="true" /> Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          <Send className="h-4 w-4" aria-hidden="true" /> {submitLabel}
        </Button>
      </div>
    </form>
  );
}

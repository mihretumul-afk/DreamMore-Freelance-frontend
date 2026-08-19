import { useState } from 'react';
import { PlusCircle, Save, X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';

/** Backend error field name → form state key. */
const ERROR_FIELD_MAP = {
  title: 'title',
  description: 'description',
  amount: 'amount',
  due_date: 'dueDate',
};

const EMPTY_FORM = { title: '', description: '', amount: '', dueDate: '' };

/**
 * Milestone create/edit form. Only confirmed MilestoneRequest fields:
 * title, description (optional), amount, due_date (optional).
 *
 * Mount it fresh per milestone (use `key` from the parent) so initialValues
 * are captured on mount. `fieldErrors` are passed with BACKEND keys and mapped
 * here — parent pages pass the raw `getFieldErrors()` result.
 */
export default function MilestoneForm({
  initialValues,
  submitLabel = 'Add Milestone',
  submitting = false,
  fieldErrors = {},
  generalError,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...initialValues }));
  const [clientErrors, setClientErrors] = useState({});

  // Map backend validation errors (title, amount, due_date, …) to display keys.
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
    if (!form.title.trim()) {
      errs.title = 'A milestone title is required.';
    } else if (form.title.trim().length > 255) {
      errs.title = 'Title must be 255 characters or fewer.';
    }
    if (!form.amount || Number(form.amount) < 1) {
      errs.amount = 'Enter an amount of at least 1.';
    } else if (Number(form.amount) > 99999999.99) {
      errs.amount = 'Amount is too large.';
    }
    if (form.dueDate && Number.isNaN(new Date(form.dueDate).getTime())) {
      errs.dueDate = 'Enter a valid date.';
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

      <Input
        label="Milestone title"
        name="title"
        placeholder="e.g. Landing page design"
        maxLength={255}
        value={form.title}
        onChange={handleChange}
        error={displayError('title')}
        disabled={submitting}
        required
      />

      <Textarea
        label="Description"
        name="description"
        rows={4}
        maxLength={5000}
        placeholder="What needs to be delivered for this milestone?"
        value={form.description}
        onChange={handleChange}
        error={displayError('description')}
        disabled={submitting}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="number"
          label="Amount (ETB)"
          name="amount"
          placeholder="0.00"
          min="1"
          max="99999999.99"
          step="0.01"
          value={form.amount}
          onChange={handleChange}
          error={displayError('amount')}
          hint="Amount released when this milestone is approved."
          disabled={submitting}
          required
        />
        <Input
          type="date"
          label="Due date"
          name="dueDate"
          value={form.dueDate}
          onChange={handleChange}
          error={displayError('dueDate')}
          hint="Optional target completion date."
          disabled={submitting}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            <X className="h-4 w-4" aria-hidden="true" /> Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {submitLabel === 'Add Milestone' ? (
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

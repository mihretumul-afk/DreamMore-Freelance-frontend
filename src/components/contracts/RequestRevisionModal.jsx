import { useState } from 'react';
import { RotateCcw, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import { formatETB } from '../../utils/format';

export default function RequestRevisionModal({
  open,
  onClose,
  milestone,
  submitting,
  fieldErrors = {},
  generalError = null,
  onSubmit,
}) {
  const [revisionNote, setRevisionNote] = useState('');
  const [localError, setLocalError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!revisionNote.trim() || revisionNote.trim().length < 3) {
      setLocalError('Please provide revision instructions (at least 3 characters).');
      return;
    }

    onSubmit?.({ revision_note: revisionNote.trim() });
  };

  const handleClose = () => {
    if (submitting) return;
    setRevisionNote('');
    setLocalError(null);
    onClose?.();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Request Milestone Revision"
      description={`Send feedback to the freelancer for milestone: "${milestone?.title}" (${milestone ? formatETB(milestone.amount) : ''})`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {(generalError || localError) && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" aria-hidden="true" />
            <span>{generalError || localError}</span>
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-800">
          <p className="font-semibold">Revision Instructions</p>
          <p className="mt-0.5 text-amber-700">
            The milestone will be placed back into revision. The freelancer will be notified and can
            upload revised deliverables.
          </p>
        </div>

        <div>
          <Textarea
            label="Feedback & Required Changes"
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="e.g. Please correct the responsive layout on mobile screens, fix the navigation bar contrast, and resubmit."
            rows={4}
            required
            error={fieldErrors.revision_note}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? (
              'Sending…'
            ) : (
              <>
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> Request Revision
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

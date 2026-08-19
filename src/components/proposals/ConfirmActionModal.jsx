import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * Accessible confirmation dialog for proposal actions. Renders the action
 * result only after the backend confirms it — the UI never fakes a status.
 */
export default function ConfirmActionModal({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  busy = false,
  error,
  onConfirm,
}) {
  return (
    <Modal open={open} onClose={busy ? undefined : onClose} title={title} size="sm">
      <div className="space-y-4">
        {description && <p className="text-sm leading-relaxed text-gray-600">{description}</p>}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" variant={tone} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

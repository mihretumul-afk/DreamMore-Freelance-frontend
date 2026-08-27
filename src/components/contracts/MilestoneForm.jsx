import { useState, useRef } from 'react';
import { PlusCircle, Save, X, UploadCloud, File, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { formatFileSize } from '../../utils/format';

/** Backend error field name → form state key. */
const ERROR_FIELD_MAP = {
  title: 'title',
  description: 'description',
  amount: 'amount',
  due_date: 'dueDate',
};

const EMPTY_FORM = { title: '', description: '', amount: '', dueDate: '' };
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_EXTENSIONS = 'jpg,jpeg,png,webp,gif,svg,mp4,webm,mov,mkv,avi,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,rtf,zip,tar,gz,rar,7z,fig,xd,sketch,psd,ai,wav,mp3,ogg,flac,aac';

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
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleFileSelect = (e) => {
    setFileError(null);
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" exceeds the 100MB file size limit.`);
        return;
      }
      validFiles.push(file);
    }

    setFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitting) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setClientErrors(errs);
      return;
    }

    if (files.length > 0) {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      if (form.description.trim()) formData.append('description', form.description.trim());
      formData.append('amount', Number(form.amount));
      if (form.dueDate) formData.append('due_date', form.dueDate);
      files.forEach((file) => formData.append('attachments[]', file));
      onSubmit?.(formData);
    } else {
      onSubmit?.(form);
    }
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

      {/* File Attachments */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Attachments (optional)
        </label>
        <p className="mb-2 text-xs text-gray-400">
          Upload reference files, mockups, or documents. Max 100MB per file.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept={ALLOWED_EXTENSIONS.split(',').map(e => `.${e}`).join(',')}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 text-center transition hover:border-brand-300 hover:bg-brand-50/20"
        >
          <UploadCloud className="h-7 w-7 text-gray-400" aria-hidden="true" />
          <p className="mt-1.5 text-xs font-semibold text-ink-900">
            Click to select files or drag and drop
          </p>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Images, Videos, Audio, PDF, Docs, Archives
          </p>
        </div>

        {fileError && (
          <p className="mt-1.5 text-xs text-red-600">{fileError}</p>
        )}

        {files.length > 0 && (
          <ul className="mt-2.5 space-y-1.5">
            {files.map((file, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <File className="h-4 w-4 text-brand-500 shrink-0" aria-hidden="true" />
                  <span className="truncate font-medium text-ink-900">{file.name}</span>
                  <span className="text-gray-400 shrink-0">({formatFileSize(file.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(idx)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                  aria-label="Remove file"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
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

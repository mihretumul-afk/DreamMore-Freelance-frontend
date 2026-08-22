import { useState, useRef } from 'react';
import {
  UploadCloud,
  File,
  X,
  Plus,
  Link as LinkIcon,
  Send,
  AlertCircle,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import Input from '../ui/Input';
import { formatETB } from '../../utils/format';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function SubmitWorkModal({
  open,
  onClose,
  milestone,
  submitting,
  fieldErrors = {},
  generalError = null,
  onSubmit,
}) {
  const fileInputRef = useRef(null);

  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [localFileError, setLocalFileError] = useState(null);

  const isResubmission = milestone?.status === 'revision_requested';

  const handleFileSelect = (e) => {
    setLocalFileError(null);
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        setLocalFileError(`"${file.name}" exceeds the 50MB file size limit.`);
        return;
      }
      validFiles.push(file);
    }

    setFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLink = (e) => {
    e.preventDefault();
    if (!newLinkUrl.trim()) return;

    let url = newLinkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    try {
      new URL(url);
      setLinks((prev) => [...prev, url]);
      setNewLinkUrl('');
    } catch {
      setLocalFileError('Please enter a valid URL (e.g. https://github.com/...)');
    }
  };

  const handleRemoveLink = (index) => {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalFileError(null);

    const formData = new FormData();
    if (description.trim()) {
      formData.append('description', description.trim());
    }

    links.forEach((link, idx) => {
      formData.append(`links[${idx}]`, link);
    });

    files.forEach((file) => {
      formData.append('files[]', file);
    });

    onSubmit?.(formData);
  };

  const handleModalClose = () => {
    if (submitting) return;
    setDescription('');
    setFiles([]);
    setLinks([]);
    setNewLinkUrl('');
    setLocalFileError(null);
    onClose?.();
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      open={open}
      onClose={handleModalClose}
      title={isResubmission ? 'Resubmit Work (Revision)' : 'Submit Deliverable'}
      description={`Submit your completed work for milestone: "${milestone?.title}" (${milestone ? formatETB(milestone.amount) : ''})`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {(generalError || localFileError) && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" aria-hidden="true" />
            <span>{generalError || localFileError}</span>
          </div>
        )}

        {isResubmission && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
            <p className="font-semibold">Resubmitting Work</p>
            <p className="mt-0.5 text-amber-700">
              Please address the employer's revision feedback and attach any updated files or links.
            </p>
          </div>
        )}

        {/* Work Description */}
        <div>
          <Textarea
            label="Work Summary & Comments"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you completed, notes for the employer, instructions to review, etc."
            rows={4}
            error={fieldErrors.description}
          />
        </div>

        {/* External Links */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            External Links (GitHub, Figma, Live Site, etc.)
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="e.g. https://github.com/myorg/project or https://figma.com/..."
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddLink}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add
            </Button>
          </div>

          {links.length > 0 && (
            <ul className="mt-2.5 space-y-1.5">
              {links.map((link, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-ink-900"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <LinkIcon className="h-3.5 w-3.5 text-brand-500 shrink-0" aria-hidden="true" />
                    <span className="truncate">{link}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    className="ml-2 text-gray-400 hover:text-red-500"
                    aria-label="Remove link"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* File Attachments */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Deliverable Files (ZIP, PDF, Images, Videos, Docs — Max 50MB each)
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.mp4,.webm,.mov,.mkv,.avi,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.zip,.tar,.gz,.rar,.7z,.fig,.xd,.sketch,.psd,.ai"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center transition hover:border-brand-300 hover:bg-brand-50/20"
          >
            <UploadCloud className="h-8 w-8 text-gray-400" aria-hidden="true" />
            <p className="mt-2 text-xs font-semibold text-ink-900">
              Click to select files or drag and drop
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              Supported: Images, Videos, PDF, Source Code (ZIP/TAR), Figma, Docs
            </p>
          </div>

          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((file, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-2.5 text-xs shadow-sm"
                >
                  <div className="flex items-center gap-2 truncate">
                    <File className="h-4 w-4 text-brand-500 shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium text-ink-900">{file.name}</span>
                    <span className="text-gray-400 shrink-0">({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={handleModalClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? (
              'Submitting…'
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />{' '}
                {isResubmission ? 'Resubmit Work' : 'Submit Work'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

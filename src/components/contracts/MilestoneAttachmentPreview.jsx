import { useState } from 'react';
import {
  File,
  Download,
  Eye,
  Image,
  Film,
  Music,
  FileText,
  Archive,
  X,
  ExternalLink,
} from 'lucide-react';
import Button from '../ui/Button';
import { formatFileSize } from '../../utils/format';

/**
 * Get the appropriate icon for a file type.
 */
function getFileIcon(fileType, mimeType) {
  if (fileType === 'image') return Image;
  if (fileType === 'video') return Film;
  if (fileType === 'audio') return Music;
  if (fileType === 'pdf') return FileText;
  if (fileType === 'archive') return Archive;
  return File;
}

/**
 * Get a color class for the file type.
 */
function getFileColor(fileType) {
  switch (fileType) {
    case 'image': return 'text-emerald-500 bg-emerald-50';
    case 'video': return 'text-purple-500 bg-purple-50';
    case 'audio': return 'text-blue-500 bg-blue-50';
    case 'pdf': return 'text-red-500 bg-red-50';
    case 'archive': return 'text-amber-500 bg-amber-50';
    default: return 'text-gray-500 bg-gray-50';
  }
}

/**
 * Inline preview modal for files.
 */
function PreviewModal({ attachment, onClose }) {
  const { mime_type, original_filename, preview_url, file_type } = attachment;

  const renderPreview = () => {
    if (file_type === 'image') {
      return (
        <img
          src={preview_url}
          alt={original_filename}
          className="max-h-[70vh] max-w-full rounded-lg object-contain"
        />
      );
    }

    if (file_type === 'video') {
      return (
        <video
          src={preview_url}
          controls
          className="max-h-[70vh] max-w-full rounded-lg"
          preload="metadata"
        >
          Your browser does not support video playback.
        </video>
      );
    }

    if (file_type === 'audio') {
      return (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
            <Music className="h-10 w-10 text-blue-500" />
          </div>
          <audio src={preview_url} controls className="w-full max-w-md" preload="metadata">
            Your browser does not support audio playback.
          </audio>
          <p className="text-sm text-gray-500">{original_filename}</p>
        </div>
      );
    }

    if (file_type === 'pdf') {
      return (
        <iframe
          src={preview_url}
          className="h-[70vh] w-full rounded-lg border border-gray-200"
          title={original_filename}
        />
      );
    }

    return null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-5xl overflow-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{original_filename}</p>
            <p className="text-xs text-gray-400">{mime_type}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}

/**
 * MilestoneAttachmentPreview — displays a list of milestone attachments
 * with inline previews for images/video/audio/PDF and download for others.
 *
 * Used by both employer-created milestone attachments and freelancer submissions.
 */
export default function MilestoneAttachmentPreview({
  attachments = [],
  title = 'Attachments',
  showTitle = true,
  onDownload,
  onDelete,
  compact = false,
}) {
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDownload = async (attachment) => {
    if (onDownload) {
      setDownloadingId(attachment.id);
      try {
        await onDownload(attachment);
      } finally {
        setDownloadingId(null);
      }
    }
  };

  const canPreview = (att) => {
    return att.preview_url && ['image', 'video', 'audio', 'pdf'].includes(att.file_type);
  };

  if (compact) {
    return (
      <>
        <ul className="space-y-1.5">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.file_type, att.mime_type);
            const colorClass = getFileColor(att.file_type);
            return (
              <li key={att.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-ink-900">{att.original_filename}</p>
                    <p className="text-[11px] text-gray-400">{formatFileSize(att.file_size)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {canPreview(att) && (
                    <button
                      onClick={() => setPreviewAttachment(att)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-brand-600 cursor-pointer"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(att)}
                    disabled={downloadingId === att.id}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-brand-600 disabled:opacity-50 cursor-pointer"
                    title="Download"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {previewAttachment && (
          <PreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
        )}
      </>
    );
  }

  return (
    <>
      {showTitle && (
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-900">
          {title} ({attachments.length})
        </h4>
      )}
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {attachments.map((att) => {
          const Icon = getFileIcon(att.file_type, att.mime_type);
          const colorClass = getFileColor(att.file_type);
          const isPreviewable = canPreview(att);

          return (
            <li
              key={att.id}
              className="group relative rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:shadow-md"
            >
              {/* Image thumbnail preview */}
              {att.file_type === 'image' && att.preview_url && (
                <div
                  className="mb-3 flex h-32 items-center justify-center overflow-hidden rounded-lg bg-gray-50 cursor-pointer"
                  onClick={() => setPreviewAttachment(att)}
                >
                  <img
                    src={att.preview_url}
                    alt={att.original_filename}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Video thumbnail */}
              {att.file_type === 'video' && (
                <div
                  className="mb-3 flex h-32 items-center justify-center rounded-lg bg-purple-50 cursor-pointer"
                  onClick={() => isPreviewable && setPreviewAttachment(att)}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Film className="h-8 w-8 text-purple-400" aria-hidden="true" />
                    <span className="text-[10px] font-medium text-purple-500">Video</span>
                  </div>
                </div>
              )}

              {/* Audio thumbnail */}
              {att.file_type === 'audio' && (
                <div
                  className="mb-3 flex h-32 items-center justify-center rounded-lg bg-blue-50 cursor-pointer"
                  onClick={() => isPreviewable && setPreviewAttachment(att)}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <Music className="h-8 w-8 text-blue-400" aria-hidden="true" />
                    <span className="text-[10px] font-medium text-blue-500">Audio</span>
                  </div>
                </div>
              )}

              {/* PDF thumbnail */}
              {att.file_type === 'pdf' && (
                <div
                  className="mb-3 flex h-32 items-center justify-center rounded-lg bg-red-50 cursor-pointer"
                  onClick={() => isPreviewable && setPreviewAttachment(att)}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <FileText className="h-8 w-8 text-red-400" aria-hidden="true" />
                    <span className="text-[10px] font-medium text-red-500">PDF</span>
                  </div>
                </div>
              )}

              {/* Non-previewable file icon */}
              {!['image', 'video', 'audio', 'pdf'].includes(att.file_type) && (
                <div className={`mb-3 flex h-32 items-center justify-center rounded-lg ${colorClass}`}>
                  <Icon className="h-10 w-10" aria-hidden="true" />
                </div>
              )}

              {/* File info */}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-ink-900">{att.original_filename}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">{formatFileSize(att.file_size)}</p>
              </div>

              {/* Actions */}
              <div className="mt-2.5 flex items-center gap-2">
                {isPreviewable && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setPreviewAttachment(att)}
                    className="cursor-pointer"
                  >
                    <Eye className="h-3 w-3" aria-hidden="true" /> View
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleDownload(att)}
                  disabled={downloadingId === att.id}
                  className="cursor-pointer"
                >
                  <Download className="h-3 w-3" aria-hidden="true" /> Download
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onDelete(att)}
                    className="ml-auto text-red-500 hover:text-red-600 cursor-pointer"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {previewAttachment && (
        <PreviewModal attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
      )}
    </>
  );
}

import { useState } from 'react';
import {
  File,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  RotateCcw,
  Eye,
  Image,
  Film,
  Music,
  FileText,
} from 'lucide-react';
import StatusBadge from '../marketplace/StatusBadge';
import { formatDate, formatFileSize } from '../../utils/format';
import { milestoneService } from '../../services/milestoneService';

export default function MilestoneSubmissionHistory({
  contractId,
  milestone,
  submissions = [],
}) {
  const [downloadingId, setDownloadingId] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewSubmission, setPreviewSubmission] = useState(null);

  if (!submissions || submissions.length === 0) {
    return null;
  }

  const handleDownload = async (submissionId, file) => {
    try {
      setDownloadingId(file.id);
      await milestoneService.downloadSubmissionFile(
        contractId,
        milestone.id,
        submissionId,
        file.id,
        file.originalFilename,
      );
    } catch {
      alert('Unable to download file. Please check your connection and try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getFileInfo = (file) => {
    const mime = file.mimeType || '';
    if (mime.startsWith('image/')) return { type: 'image', Icon: Image, color: 'text-emerald-500' };
    if (mime.startsWith('video/')) return { type: 'video', Icon: Film, color: 'text-purple-500' };
    if (mime.startsWith('audio/')) return { type: 'audio', Icon: Music, color: 'text-blue-500' };
    if (mime === 'application/pdf') return { type: 'pdf', Icon: FileText, color: 'text-red-500' };
    return { type: 'document', Icon: File, color: 'text-gray-500' };
  };

  const getPreviewUrl = (cid, mid, sid, fid) => {
    return `/api/v1/contracts/${cid}/milestones/${mid}/submissions/${sid}/files/${fid}/preview`;
  };

  const canPreview = (file) => {
    const mime = file.mimeType || '';
    return mime.startsWith('image/') || mime.startsWith('video/') || mime.startsWith('audio/') || mime === 'application/pdf';
  };

  const renderPreviewModal = () => {
    if (!previewFile || !previewSubmission) return null;
    const url = getPreviewUrl(contractId, milestone.id, previewSubmission.id, previewFile.id);
    const mime = previewFile.mimeType || '';

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        onClick={() => { setPreviewFile(null); setPreviewSubmission(null); }}
      >
        <div
          className="relative max-h-[90vh] max-w-5xl overflow-auto rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{previewFile.originalFilename}</p>
              <p className="text-xs text-gray-400">{mime}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={previewFile.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" /> Download
              </a>
              <button
                onClick={() => { setPreviewFile(null); setPreviewSubmission(null); }}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-6">
            {mime.startsWith('image/') && (
              <img src={url} alt={previewFile.originalFilename} className="max-h-[70vh] max-w-full rounded-lg object-contain mx-auto" />
            )}
            {mime.startsWith('video/') && (
              <video src={url} controls className="max-h-[70vh] max-w-full rounded-lg mx-auto" preload="metadata" />
            )}
            {mime.startsWith('audio/') && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
                  <Music className="h-10 w-10 text-blue-500" />
                </div>
                <audio src={url} controls className="w-full max-w-md" preload="metadata" />
                <p className="text-sm text-gray-500">{previewFile.originalFilename}</p>
              </div>
            )}
            {mime === 'application/pdf' && (
              <iframe src={url} className="h-[70vh] w-full rounded-lg border border-gray-200" title={previewFile.originalFilename} />
            )}
          </div>
        </div>
      </div>
    );
  };

  // Reverse chronological or numbered revisions
  const totalSubmissions = submissions.length;

  return (
    <>
      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 sm:p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-left cursor-pointer"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-ink-900">
              Deliverable Submissions ({totalSubmissions})
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden="true" />
            )}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 space-y-4">
            {submissions.map((sub, index) => {
              // Label submissions: Revision 1, Revision 2, ... or Final Submission
              const revisionNumber = totalSubmissions - index;
              const isLatest = index === 0;
              const label =
                totalSubmissions === 1
                  ? 'Submission'
                  : isLatest && sub.status === 'approved'
                    ? 'Final Approved Submission'
                    : `Revision ${revisionNumber}`;

              return (
                <div
                  key={sub.id}
                  className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm text-xs"
                >
                  {/* Submission Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink-900">{label}</span>
                      <StatusBadge status={sub.status} size="xs" />
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Submitted {formatDate(sub.submittedAt || sub.createdAt)}</span>
                    </div>
                  </div>

                  {/* Description */}
                  {sub.description && (
                    <div className="mt-2.5">
                      <p className="font-semibold text-gray-700">Summary & Notes:</p>
                      <p className="mt-1 whitespace-pre-line text-gray-600 leading-relaxed">
                        {sub.description}
                      </p>
                    </div>
                  )}

                  {/* External Links */}
                  {sub.links && sub.links.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold text-gray-700">External Links:</p>
                      <ul className="mt-1.5 space-y-1">
                        {sub.links.map((link, lIdx) => (
                          <li key={lIdx}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:text-brand-700 underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span className="truncate max-w-md">{link}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Attached Files */}
                  {sub.files && sub.files.length > 0 && (
                    <div className="mt-3">
                      <p className="font-semibold text-gray-700">Deliverable Files:</p>
                      <ul className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {sub.files.map((file) => {
                          const { type: fileType, Icon: FileIcon, color } = getFileInfo(file);
                          const isPreviewableFile = canPreview(file);
                          return (
                            <li
                              key={file.id}
                              className="group rounded-md border border-gray-100 bg-gray-50 p-2.5"
                            >
                              {/* Inline image preview */}
                              {fileType === 'image' && (
                                <div
                                  className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded-md bg-gray-100 cursor-pointer"
                                  onClick={() => { setPreviewFile(file); setPreviewSubmission(sub); }}
                                >
                                  <img
                                    src={getPreviewUrl(contractId, milestone.id, sub.id, file.id)}
                                    alt={file.originalFilename}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              )}

                              {/* Non-image file icon strip */}
                              {fileType !== 'image' && (
                                <div className="mb-2 flex h-10 items-center gap-2">
                                  <FileIcon className={`h-5 w-5 ${color}`} aria-hidden="true" />
                                  <span className="text-xs font-medium text-gray-600">{fileType.charAt(0).toUpperCase() + fileType.slice(1)}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 truncate">
                                  <span className="truncate font-medium text-ink-900 text-xs">
                                    {file.originalFilename}
                                  </span>
                                  <span className="text-[10px] text-gray-400 shrink-0">
                                    ({formatFileSize(file.fileSize)})
                                  </span>
                                </div>
                                <div className="flex shrink-0 items-center gap-1">
                                  {isPreviewableFile && (
                                    <button
                                      type="button"
                                      onClick={() => { setPreviewFile(file); setPreviewSubmission(sub); }}
                                      className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-brand-600 cursor-pointer"
                                      title="Preview"
                                    >
                                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDownload(sub.id, file)}
                                    disabled={downloadingId === file.id}
                                    className="rounded p-1 text-brand-600 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50 cursor-pointer"
                                    title="Download file"
                                  >
                                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Employer Revision Feedback */}
                  {sub.status === 'revision_requested' && sub.revisionNote && (
                    <div className="mt-3.5 rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-amber-900">
                      <div className="flex items-start gap-2">
                        <RotateCcw className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="font-bold">Employer Revision Request</p>
                          <p className="mt-1 text-amber-800 leading-relaxed">
                            "{sub.revisionNote}"
                          </p>
                          {sub.reviewedAt && (
                            <p className="mt-1 text-[11px] text-amber-600">
                              Requested on {formatDate(sub.reviewedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approval note */}
                  {sub.status === 'approved' && (
                    <div className="mt-3.5 rounded-lg border border-green-200 bg-green-50/70 p-2.5 text-green-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" aria-hidden="true" />
                        <p className="font-semibold text-green-800">
                          Approved by employer {sub.reviewedAt ? `on ${formatDate(sub.reviewedAt)}` : ''}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {renderPreviewModal()}
    </>
  );
}

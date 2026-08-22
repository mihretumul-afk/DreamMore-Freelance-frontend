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
} from 'lucide-react';
import StatusBadge from '../marketplace/StatusBadge';
import { formatDate } from '../../utils/format';
import { milestoneService } from '../../services/milestoneService';

export default function MilestoneSubmissionHistory({
  contractId,
  milestone,
  submissions = [],
}) {
  const [downloadingId, setDownloadingId] = useState(null);
  const [expanded, setExpanded] = useState(true);

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

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Reverse chronological or numbered revisions
  const totalSubmissions = submissions.length;

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 sm:p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left"
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
                      {sub.files.map((file) => (
                        <li
                          key={file.id}
                          className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <File className="h-4 w-4 text-brand-500 shrink-0" aria-hidden="true" />
                            <span className="truncate font-medium text-ink-900">
                              {file.originalFilename}
                            </span>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              ({formatFileSize(file.fileSize)})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownload(sub.id, file)}
                            disabled={downloadingId === file.id}
                            className="ml-2 inline-flex items-center gap-1 rounded p-1 text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                            title="Download file"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
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
  );
}

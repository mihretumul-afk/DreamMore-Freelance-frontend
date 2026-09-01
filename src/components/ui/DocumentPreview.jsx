import { useEffect, useState } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
const PDF_TYPE = 'application/pdf';

/**
 * DocumentPreview — modal for previewing uploaded credential documents.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - fileName: string — original file name
 * - fileType: string — MIME type (e.g. 'application/pdf', 'image/jpeg')
 * - downloadUrl: string — URL to preview/download the file
 * - loading: boolean — external loading state
 * - onDownload: () => void — download handler
 */
export default function DocumentPreview({
  open,
  onClose,
  fileName,
  fileType,
  downloadUrl,
  loading = false,
  onDownload,
}) {
  const [error, setError] = useState(false);

  const cleanName = (fileName || '').toLowerCase();
  const isImage =
    (fileType && IMAGE_TYPES.includes(fileType)) ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(cleanName);
  const isPdf = fileType === PDF_TYPE || /\.pdf$/i.test(cleanName);
  const isUnsupported = !isImage && !isPdf;

  useEffect(() => {
    if (open) {
      setError(false);
    }
  }, [open, downloadUrl]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={fileName || 'Document Preview'}
      size="lg"
    >
      <div className="flex flex-col items-center gap-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <span className="ml-2.5 text-sm font-medium text-gray-600">Loading document...</span>
          </div>
        )}

        {!loading && (!downloadUrl || error) && (
          <div className="flex flex-col items-center gap-3 py-10">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Document preview unavailable</p>
            <p className="text-xs text-gray-400 max-w-sm text-center">The document file could not be loaded for inline preview. It may not have been uploaded or the file may be unavailable.</p>
          </div>
        )}

        {!loading && !error && downloadUrl && isImage && (
          <div className="flex max-h-[60vh] max-w-full justify-center overflow-auto rounded-lg border border-gray-200 bg-gray-50/50 p-2">
            <img
              src={downloadUrl}
              alt={fileName || 'Document'}
              onError={() => setError(true)}
              className="max-h-[56vh] max-w-full rounded object-contain shadow-sm"
            />
          </div>
        )}

        {!loading && !error && downloadUrl && isPdf && (
          <div className="w-full">
            <iframe
              src={downloadUrl}
              title={fileName || 'Document Preview'}
              className="h-[60vh] w-full rounded-lg border border-gray-200 shadow-sm"
            />
          </div>
        )}

        {!loading && !error && downloadUrl && isUnsupported && (
          <div className="flex flex-col items-center gap-3 py-10">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">
              Preview is not supported for this file format.
            </p>
            <p className="text-xs text-gray-400">Please download the file to inspect its contents.</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 w-full">
          {onDownload && (
            <Button variant="primary" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4" /> Download
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

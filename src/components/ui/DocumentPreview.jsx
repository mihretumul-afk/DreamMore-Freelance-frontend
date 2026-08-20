import { useEffect, useState } from 'react';
import { FileText, Loader2, ExternalLink } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const PDF_TYPE = 'application/pdf';

/**
 * DocumentPreview — modal for previewing uploaded credential documents.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - fileName: string — original file name
 * - fileType: string — MIME type (e.g. 'application/pdf', 'image/jpeg')
 * - downloadUrl: string — URL to download the file
 * - onDownload: async () => void — download handler (fetches blob and triggers download)
 */
export default function DocumentPreview({ open, onClose, fileName, fileType, downloadUrl, loading: externalLoading, onDownload }) {
  const [contentLoading, setContentLoading] = useState(true);
  const loading = externalLoading || contentLoading;
  const [error, setError] = useState(false);

  const isImage = fileType && IMAGE_TYPES.includes(fileType);
  const isPdf = fileType === PDF_TYPE || fileName?.toLowerCase().endsWith('.pdf');
  const isUnsupported = !isImage && !isPdf;

  // Reset content loading state when URL changes and clean up blob URLs
  useEffect(() => {
    if (open && downloadUrl) {
      setContentLoading(true);
      setError(false);
    }
  }, [open, downloadUrl]);

  // Clean up blob URL on close
  useEffect(() => {
    if (!open && downloadUrl && downloadUrl.startsWith('blob:')) {
      window.URL.revokeObjectURL(downloadUrl);
    }
  }, [open, downloadUrl]);

  const handleLoad = () => setContentLoading(false);
  const handleError = () => {
    setContentLoading(false);
    setError(true);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={fileName || 'Document Preview'}
      size="lg"
    >
      <div className="flex flex-col items-center gap-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading preview...</span>
          </div>
        )}

        {!loading && !downloadUrl && !error && (
          <div className="flex flex-col items-center gap-3 py-8">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">Unable to load preview.</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-8">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">Unable to load preview.</p>
          </div>
        )}

        {!error && isImage && (
          <div className={`max-h-[60vh] overflow-auto ${loading ? 'hidden' : ''}`}>
            <img
              src={downloadUrl}
              alt={fileName}
              onLoad={handleLoad}
              onError={handleError}
              className="max-w-full rounded-lg border border-gray-200"
            />
          </div>
        )}

        {!error && isPdf && (
          <div className={`w-full ${loading ? 'hidden' : ''}`}>
            <iframe
              src={downloadUrl}
              title={fileName}
              onLoad={handleLoad}
              onError={handleError}
              className="h-[60vh] w-full rounded-lg border border-gray-200"
            />
          </div>
        )}

        {isUnsupported && (
          <div className="flex flex-col items-center gap-3 py-8">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">
              Preview not available for this file type. Download to view.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {onDownload && (
            <Button variant="primary" size="sm" onClick={onDownload}>
              <ExternalLink className="h-4 w-4" /> Download
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

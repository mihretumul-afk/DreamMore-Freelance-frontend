import { useCallback, useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import Avatar from './Avatar';
import Button from '../ui/Button';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

/**
 * Avatar upload widget with preview, validation, upload progress, and remove.
 *
 * Props:
 * - name: user's name for initials fallback
 * - src: current avatar URL (null if none)
 * - onUpload: async (File) => void — called with the selected file
 * - onRemove: async () => void — called to remove the avatar
 * - disabled: boolean
 * - size: Avatar size to render (default 'xl')
 * - overlay: when true, renders compact circular action chips over the avatar's
 *   corner (hover-free, touch friendly) instead of a full button row beneath it.
 */
export default function AvatarUpload({
  name = '?',
  src,
  onUpload,
  onRemove,
  disabled = false,
  size = 'xl',
  overlay = false,
}) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState(null);

  const currentSrc = preview || src;

  const validateFile = useCallback((file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, or WEBP image.';
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File size must be less than ${MAX_SIZE_MB}MB.`;
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = '';
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      await onUpload(file);
      setPreview(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }, [onUpload, validateFile]);

  const handleRemove = useCallback(async () => {
    setError(null);
    setRemoving(true);
    try {
      await onRemove();
      setPreview(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Remove failed. Please try again.');
    } finally {
      setRemoving(false);
    }
  }, [onRemove]);

  const isLoading = uploading || removing;

  // Overlay layout: avatar with small action chips anchored to its corner.
  if (overlay) {
    return (
      <div className="flex shrink-0 flex-col items-center gap-2">
        <div className="relative">
          <Avatar
            name={name}
            src={currentSrc}
            size={size}
            variant="brand"
            className="rounded-full ring-4 ring-white/90 shadow-elevated"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-900/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}

          <div className="absolute -bottom-2 -right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading}
              title={uploading ? 'Uploading…' : 'Change photo'}
              aria-label="Change photo"
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-ink-900 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            {src && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isLoading}
                title="Remove photo"
                aria-label="Remove photo"
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-danger-500 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-danger-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="Upload profile photo"
        />

        {error && (
          <p role="alert" className="max-w-[16rem] text-center text-xs font-medium text-danger-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  // Default layout: avatar with a full button row beneath it.
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar name={name} src={currentSrc} size={size} variant="brand" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isLoading}
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          {uploading ? 'Uploading...' : 'Change Photo'}
        </Button>

        {src && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isLoading}
          >
            <Trash2 className="h-4 w-4 text-danger-500" aria-hidden="true" />
            Remove
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload profile photo"
      />

      {error && (
        <p role="alert" className="text-xs font-medium text-danger-600">
          {error}
        </p>
      )}

      <p className="text-center text-xs text-gray-400">
        JPG, PNG, or WEBP. Max {MAX_SIZE_MB}MB.
      </p>
    </div>
  );
}

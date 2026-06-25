
import { useState, useRef } from 'react';
import { Button } from '@/modules/application/components/DesignSystem/ui/button';
import { createSupabaseClient } from '@/models/supabase/services/SupabaseClient';
import { StorageService } from '@/models/storage/services/StorageService';
import { notifyAboutError } from '@/modules/application/utils/notifyAboutError';
import { Upload, X, ImageIcon } from 'lucide-react';

export interface EventImageState {
  url: string;
  path: string;
}

interface EventImageUploadProps {
  currentImageUrl?: string | null;
  onChange: (image: EventImageState | null) => void;
}

const EventImageUpload = ({ currentImageUrl, onChange }: EventImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    try {
      setIsUploading(true);
      const storageService = new StorageService(createSupabaseClient());
      const result = await storageService.uploadEventImage(file);
      onChange({ url: result.storage_url, path: result.storage_path });
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(result.storage_url);
    } catch (error) {
      notifyAboutError(error);
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img
            src={previewUrl}
            alt="Challenge image"
            className="w-full"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-sm transition-colors"
          >
            <X size={14} className="text-gray-700" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors text-gray-500 disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <ImageIcon size={24} />
              <span className="text-sm font-medium">Click to upload an image</span>
              <span className="text-xs">PNG, JPG, WebP up to 10MB</span>
            </>
          )}
        </button>
      )}

      {previewUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          <Upload size={14} className="mr-2" />
          {isUploading ? 'Uploading...' : 'Change Image'}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default EventImageUpload;

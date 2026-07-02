"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, ImageIcon, Film, FileImage } from "lucide-react";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { toast } from "sonner";

interface ChallengeMediaUploadProps {
  label: string;
  description: string;
  acceptedTypes: string[];
  acceptString: string;
  maxSizeMB: number;
  currentUrl?: string | null;
  currentLabel?: string;
  icon: "image" | "poster" | "video";
  onFileSelect: (file: File | null) => void;
  file: File | null;
}

const iconMap = {
  image: ImageIcon,
  poster: FileImage,
  video: Film,
};

const ChallengeMediaUpload = ({
  label,
  description,
  acceptedTypes,
  acceptString,
  maxSizeMB,
  currentUrl,
  currentLabel,
  icon,
  onFileSelect,
  file,
}: ChallengeMediaUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const IconComponent = iconMap[icon];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const processFile = useCallback(
    (selectedFile: File) => {
      if (!acceptedTypes.includes(selectedFile.type)) {
        toast.error("File type not supported");
        return;
      }
      if (selectedFile.size > maxSizeBytes) {
        toast.error(`File must be less than ${maxSizeMB}MB`);
        return;
      }
      onFileSelect(selectedFile);

      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
      } else if (selectedFile.type.startsWith("video/")) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl("");
      }
    },
    [acceptedTypes, maxSizeBytes, maxSizeMB, onFileSelect],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const hasPreview = !!previewUrl;
  const isVideo = file?.type.startsWith("video/") || (icon === "video" && !file && !!currentUrl);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-500">{description}</p>

      {(file || currentUrl) && (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          {hasPreview ? (
            isVideo ? (
              <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100 flex items-center justify-center">
                <Film size={20} className="text-gray-400" />
              </div>
            ) : (
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
              </div>
            )
          ) : currentUrl ? (
            isVideo ? (
              <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100 flex items-center justify-center">
                <Film size={20} className="text-gray-400" />
              </div>
            ) : (
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                <img src={currentUrl} alt="Current" className="h-full w-full object-contain" />
              </div>
            )
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gray-100">
              <IconComponent size={20} className="text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {file ? file.name : currentLabel || "Current file"}
            </p>
            <p className="text-xs text-gray-500">
              {file
                ? `${(file.size / (1024 * 1024)).toFixed(1)}MB`
                : currentLabel || "Current media"}
            </p>
          </div>
          {file && (
            <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
              <X size={14} />
            </Button>
          )}
        </div>
      )}

      <div
        className={`rounded-lg border-2 border-dashed p-4 transition-colors cursor-pointer ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300"}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="text-center">
          <Upload
            className={`mx-auto mb-2 h-8 w-8 ${isDragging ? "text-blue-400" : "text-gray-400"}`}
          />
          <p className="text-sm text-gray-600">
            {currentUrl
              ? "Drag & drop or choose a file to replace"
              : "Drag & drop or choose a file"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Max {maxSizeMB}MB</p>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            accept={acceptString}
            onChange={handleFileSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default ChallengeMediaUpload;

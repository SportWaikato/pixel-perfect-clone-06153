import { useState } from "react";
import { Button } from "@/modules/application/components/DesignSystem/ui/button";
import { Sparkles, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { generateBadgeImage } from "@/lib/ai.functions";
import { StorageService } from "@/models/storage/services/StorageService";
import { createSupabaseClient } from "@/models/supabase/services/SupabaseClient";

interface AIBadgeGeneratorProps {
  badgeName: string;
  badgeDescription?: string;
  iconContext?: string;
  onGenerated: (storageUrl: string, storagePath: string) => void;
  hasExistingImage: boolean;
  disabled?: boolean;
}

const AIBadgeGenerator = ({
  badgeName,
  badgeDescription,
  iconContext,
  onGenerated,
  hasExistingImage,
  disabled,
}: AIBadgeGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleGenerate = async () => {
    if (!badgeName.trim()) {
      toast.error("Enter a badge name first");
      return;
    }

    setGenerating(true);
    setPreviewUrl(null);
    setGeneratedBlob(null);
    setUploaded(false);

    try {
      // Generation happens server-side so the Gemini key never ships to the browser.
      const result = await generateBadgeImage({
        data: {
          badgeName: badgeName.trim(),
          badgeDescription: badgeDescription?.trim(),
          iconContext: iconContext?.trim(),
        },
      });

      const byteChars = atob(result.base64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
      const imageBlob = new Blob([bytes], { type: result.mimeType });

      const url = URL.createObjectURL(imageBlob);
      setPreviewUrl(url);
      setGeneratedBlob(imageBlob);
      toast.success("Badge generated! Review it and click Upload to save.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate badge";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setGeneratedBlob(null);
    setUploaded(false);
  };

  const handleUpload = async () => {
    if (!generatedBlob) return;
    setUploading(true);

    try {
      const supabase = createSupabaseClient();
      const storageService = new StorageService(supabase);
      const { storage_url, storage_path } =
        await storageService.uploadBadgeImageFromBlob(generatedBlob);

      onGenerated(storage_url, storage_path);
      setUploaded(true);
      toast.success("Badge uploaded to storage");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload badge";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generating || disabled || !badgeName.trim()}
          className="gap-2"
        >
          {generating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Generate with AI
            </>
          )}
        </Button>

        {previewUrl && !uploaded && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleUpload}
            disabled={uploading}
            className="gap-2"
            style={{ backgroundColor: "#1B5E4B" }}
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload to Storage"
            )}
          </Button>
        )}

        {uploaded && (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <Check size={14} />
            Uploaded
          </span>
        )}
      </div>

      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="AI generated badge preview"
            className="w-32 h-32 object-contain rounded-xl border border-gray-200"
          />
          {!uploaded && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {hasExistingImage && previewUrl && !uploaded && (
        <p className="text-xs text-amber-600">
          Generating a new badge will replace the existing one after upload.
        </p>
      )}
    </div>
  );
};

export default AIBadgeGenerator;

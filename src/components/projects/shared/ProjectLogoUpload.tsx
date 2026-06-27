import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { SECURITY_CONFIG } from "@/config/security";
import { setPendingProjectLogo } from "@/utils/projectPendingFiles";

interface ProjectLogoUploadProps {
  logoUrl: string | null;
  storageKey: string;
  disabled?: boolean;
}

const resolveDisplayUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("http")) return url;
  const filename = url.split("/").pop();
  return filename
    ? `${SECURITY_CONFIG.BASE}/project_vr_app_document/${encodeURIComponent(filename)}`
    : url;
};

const ProjectLogoUpload = ({
  logoUrl,
  storageKey,
  disabled = false,
}: ProjectLogoUploadProps) => {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalPreview(null);
  }, [logoUrl, storageKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setPendingProjectLogo(storageKey, file);
    setLocalPreview(URL.createObjectURL(file));
  };

  const clear = () => {
    setPendingProjectLogo(storageKey, null);
    setLocalPreview(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setPendingProjectLogo(storageKey, file);
      setLocalPreview(URL.createObjectURL(file));
    }
  };

  const displayUrl = resolveDisplayUrl(localPreview ?? logoUrl);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-lg border transition-all ${
        isDragging
          ? "border-[var(--theme-color)] bg-[var(--theme-color)]/5 scale-[1.01]"
          : "bg-muted/20 border-slate-200"
      }`}
    >
      <div className="shrink-0">
        {displayUrl ? (
          <div className="relative">
            <div
              className={`h-[120px] w-[120px] rounded-lg border bg-white overflow-hidden flex items-center justify-center p-2 ${disabled ? "" : "cursor-pointer"}`}
              onClick={() => {
                if (disabled) return;
                inputRef.current?.click();
              }}
            >
              <img
                src={displayUrl}
                alt="Project logo preview"
                className="max-h-full max-w-full h-auto w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 z-10"
                onClick={clear}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : (
          <div
            className={`h-[120px] w-[120px] rounded-lg border border-dashed flex flex-col items-center justify-center bg-background text-muted-foreground ${disabled ? "" : "cursor-pointer"} gap-1`}
            onClick={() => {
              if (disabled) return;
              inputRef.current?.click();
            }}
          >
            <Camera className="h-7 w-7" />
            <span className="text-xs font-medium">No logo</span>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-2 w-full min-w-0">
        <Label htmlFor={`project_logo_${storageKey}`}>Project Logo</Label>
        <p className="text-xs text-muted-foreground">
          Upload a square image (PNG, JPG, WebP) or drag and drop it here.
        </p>
        <Input
          id={`project_logo_${storageKey}`}
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleChange}
          disabled={disabled}
          className="max-w-full sm:max-w-sm cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ProjectLogoUpload;

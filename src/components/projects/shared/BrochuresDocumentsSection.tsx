import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Trash2, Upload, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DocumentFolderProps {
  title: string;
  description: string;
  existingUrls: string[];
  newFiles: File[];
  removedFilenames: string[];
  inputId: string;
  onFilesSelected: (files: File[]) => void;
  onRemoveExisting: (filename: string) => void;
  onRemoveNew: (index: number) => void;
  onPreview: (url: string, name: string) => void;
}

const filenameFromUrl = (url: string) => {
  try {
    return decodeURIComponent(url.split("/").pop() || url);
  } catch {
    return url;
  }
};

const isImageFile = (name: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(name);

const isPdfFile = (name: string) => /\.pdf$/i.test(name);

type PreviewState =
  | { type: "image"; url: string; name: string }
  | { type: "pdf"; url: string; name: string }
  | { type: "url"; url: string; name: string };

const DocumentFolder = ({
  title,
  description,
  existingUrls,
  newFiles,
  removedFilenames,
  inputId,
  onFilesSelected,
  onRemoveExisting,
  onRemoveNew,
  onPreview,
}: DocumentFolderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const visibleExisting = existingUrls.filter(
    (url) => !removedFilenames.includes(filenameFromUrl(url)),
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) onFilesSelected(files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById(inputId)?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover:bg-muted/5",
            isDragging
              ? "border-[var(--theme-color)] bg-[var(--theme-color)]/5 scale-[1.01]"
              : "border-slate-200 dark:border-slate-800"
          )}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <span className="text-sm text-primary font-medium block">
            Choose files (PDF, images) or drag & drop here
          </span>
          <Input
            id={inputId}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) onFilesSelected(files);
              e.target.value = "";
            }}
          />
        </div>

        <div className="space-y-2">
          {visibleExisting.map((url) => {
            const name = filenameFromUrl(url);
            return (
              <div
                key={url}
                className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/40 border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm truncate">{name}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => onPreview(url, name)}
                    title="Preview document"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => onRemoveExisting(name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {newFiles.map((file, idx) => {
            const url = URL.createObjectURL(file);
            return (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm truncate">{file.name} (new)</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => onPreview(url, file.name)}
                    title="Preview new document"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => onRemoveNew(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {!visibleExisting.length && !newFiles.length && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No documents uploaded yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface BrochuresDocumentsSectionProps {
  marketingUrls: string[];
  marketingFiles: File[];
  marketingRemoved: string[];
  reraUrls: string[];
  reraFiles: File[];
  reraRemoved: string[];
  onMarketingFiles: (files: File[]) => void;
  onMarketingRemoveExisting: (filename: string) => void;
  onMarketingRemoveNew: (index: number) => void;
  onReraFiles: (files: File[]) => void;
  onReraRemoveExisting: (filename: string) => void;
  onReraRemoveNew: (index: number) => void;
}

const BrochuresDocumentsSection = ({
  marketingUrls,
  marketingFiles,
  marketingRemoved,
  reraUrls,
  reraFiles,
  reraRemoved,
  onMarketingFiles,
  onMarketingRemoveExisting,
  onMarketingRemoveNew,
  onReraFiles,
  onReraRemoveExisting,
  onReraRemoveNew,
}: BrochuresDocumentsSectionProps) => {
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const openPreview = (url: string, name: string) => {
    if (isImageFile(name)) {
      setPreview({ type: "image", url, name });
    } else if (isPdfFile(name)) {
      setPreview({ type: "pdf", url, name });
    } else {
      setPreview({ type: "url", url, name });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Brochures & Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload marketing collaterals and RERA legal documents.
        </p>
      </div>

      <DocumentFolder
        title="Marketing Brochures & Collaterals"
        description="Upload customer-facing brochures, flyers, floor plan books, and marketing media PDFs"
        existingUrls={marketingUrls}
        newFiles={marketingFiles}
        removedFilenames={marketingRemoved}
        inputId="marketing_brochures"
        onFilesSelected={(files) => onMarketingFiles([...marketingFiles, ...files])}
        onRemoveExisting={onMarketingRemoveExisting}
        onRemoveNew={onMarketingRemoveNew}
        onPreview={openPreview}
      />

      <DocumentFolder
        title="RERA"
        description="Upload RERA registration certificate and related legal documents"
        existingUrls={reraUrls}
        newFiles={reraFiles}
        removedFilenames={reraRemoved}
        inputId="rera_documents"
        onFilesSelected={(files) => onReraFiles([...reraFiles, ...files])}
        onRemoveExisting={onReraRemoveExisting}
        onRemoveNew={onReraRemoveNew}
        onPreview={openPreview}
      />

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-3xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview?.type === "image" && (
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[70vh] w-full object-contain rounded"
            />
          )}
          {preview?.type === "pdf" && (
            <iframe
              src={preview.url}
              title={preview.name}
              className="w-full h-[70vh] rounded border bg-white"
            />
          )}
          {preview?.type === "url" && (
            <div className="space-y-3">
              <p className="text-sm break-all text-muted-foreground">
                {preview.url}
              </p>
              <Button asChild>
                <a href={preview.url} target="_blank" rel="noopener noreferrer">
                  Open in new tab
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrochuresDocumentsSection;

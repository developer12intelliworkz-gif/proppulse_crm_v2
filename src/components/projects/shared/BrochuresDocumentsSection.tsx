import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Trash2, Upload } from "lucide-react";

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
}

const filenameFromUrl = (url: string) => {
  try {
    return decodeURIComponent(url.split("/").pop() || url);
  } catch {
    return url;
  }
};

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
}: DocumentFolderProps) => {
  const visibleExisting = existingUrls.filter(
    (url) => !removedFilenames.includes(filenameFromUrl(url)),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <Label htmlFor={inputId} className="cursor-pointer text-primary font-medium">
            Choose files (PDF, images)
          </Label>
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
          {newFiles.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center justify-between gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm truncate">{file.name} (new)</span>
              </div>
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
          ))}
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
}: BrochuresDocumentsSectionProps) => (
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
    />
  </div>
);

export default BrochuresDocumentsSection;

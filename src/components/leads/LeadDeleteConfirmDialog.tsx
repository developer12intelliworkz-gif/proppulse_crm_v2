import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface LeadDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  leadName?: string | null;
  deleting?: boolean;
  onConfirm: (shouldExport: boolean) => void;
}

const LeadDeleteConfirmDialog = ({
  open,
  onOpenChange,
  count,
  leadName,
  deleting = false,
  onConfirm,
}: LeadDeleteConfirmDialogProps) => {
  const isBulk = count > 1;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {isBulk ? `${count} leads` : "lead"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk ? (
              <>
                You are about to delete <strong>{count} leads</strong>. This
                action cannot be undone.
              </>
            ) : (
              <>
                You are about to delete{" "}
                <strong>{leadName || "this lead"}</strong>. This action cannot
                be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            disabled={deleting}
            onClick={() => onConfirm(false)}
          >
            {deleting ? "Deleting..." : "Delete Only"}
          </Button>
          <Button
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleting}
            onClick={() => onConfirm(true)}
          >
            {deleting ? "Processing..." : "Export & Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeadDeleteConfirmDialog;

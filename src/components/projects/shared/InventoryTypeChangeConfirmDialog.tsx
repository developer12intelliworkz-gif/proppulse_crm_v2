import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InventoryTypeChangeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const InventoryTypeChangeConfirmDialog = ({
  open,
  onOpenChange,
  confirming = false,
  onConfirm,
  onCancel,
}: InventoryTypeChangeConfirmDialogProps) => (
  <AlertDialog
    open={open}
    onOpenChange={(next) => {
      if (!next && !confirming) {
        onCancel();
      }
      onOpenChange(next);
    }}
  >
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Change Inventory Type?</AlertDialogTitle>
        <AlertDialogDescription>
          Changing the Project Type or Subcategory will permanently delete all
          previously created towers, floors, and units for this project. This
          action cannot be undone. Are you sure you want to continue?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel disabled={confirming} onClick={onCancel}>
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          disabled={confirming}
          onClick={(e) => {
            e.preventDefault();
            onConfirm();
          }}
        >
          {confirming ? "Deleting inventory..." : "Yes, Continue"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default InventoryTypeChangeConfirmDialog;

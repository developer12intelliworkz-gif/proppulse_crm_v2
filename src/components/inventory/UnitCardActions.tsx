import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnitCardActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  className?: string;
  alwaysVisible?: boolean;
  size?: "default" | "compact";
}

const UnitCardActions = ({
  onEdit,
  onDelete,
  deleting = false,
  className,
  alwaysVisible = false,
  size = "default",
}: UnitCardActionsProps) => {
  if (!onEdit && !onDelete) return null;

  const compact = size === "compact";

  return (
    <div
      className={cn(
        "absolute z-10 flex items-center rounded-md border bg-background/95 shadow-sm backdrop-blur-sm",
        compact ? "top-0 right-0 p-0" : "top-1.5 right-1.5 p-0.5",
        alwaysVisible
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "text-muted-foreground hover:text-foreground",
            compact ? "h-5 w-5" : "h-6 w-6",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit unit"
        >
          <Pencil className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            compact ? "h-5 w-5" : "h-6 w-6",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={deleting}
          title="Delete unit"
        >
          <Trash2 className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </Button>
      )}
    </div>
  );
};

export default UnitCardActions;

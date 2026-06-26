import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearSelection,
  selectAllUnits,
} from "@/store/slices/inventorySlice";
import { Pencil, X } from "lucide-react";

interface UnitSelectionBarProps {
  onBulkEdit: () => void;
}

const UnitSelectionBar = ({ onBulkEdit }: UnitSelectionBarProps) => {
  const dispatch = useAppDispatch();
  const selectedUnits = useAppSelector((s) => s.inventory.selectedUnits);
  const count = selectedUnits.length;

  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 shadow-sm">
      <p className="text-sm font-medium">
        <span className="text-primary font-semibold">{count}</span> unit
        {count === 1 ? "" : "s"} selected
        <span className="text-muted-foreground font-normal ml-2 hidden sm:inline">
          Tip: Ctrl+click to multi-select
        </span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => dispatch(selectAllUnits())}
        >
          Select all
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => dispatch(clearSelection())}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Deselect all
        </Button>
        {count >= 2 && (
          <Button type="button" size="sm" onClick={onBulkEdit}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Bulk edit
          </Button>
        )}
      </div>
    </div>
  );
};

export default UnitSelectionBar;

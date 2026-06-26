import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearUnits,
  generateUnits,
  selectOnlyUnit,
  toggleUnitSelection,
  removeUnit,
  updateUnit,
} from "@/store/slices/inventorySlice";
import { handleUnitSelectClick } from "./unitSelectionUtils";
import { getSubcategory, STATUS_UI } from "./inventoryConstants";
import UnitEditModal from "./UnitEditModal";
import UnitCardActions from "./UnitCardActions";
import type { InventoryUnit } from "@/store/types/inventory";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteInventoryUnitFromDatabase,
  persistSingleInventoryUnit,
} from "./inventoryPersist";
import { toast } from "sonner";

const SimpleUnitBuilder = () => {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector((s) => s.inventory);
  const { projectType, subcategory, units, projectId, selectedUnits } =
    inventory;
  const [count, setCount] = useState("");
  const [editing, setEditing] = useState<InventoryUnit | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

  const subcat = getSubcategory(projectType, subcategory);
  const unitLabel = subcat?.unitLabel || "Unit";
  const generated = units.length > 0;

  const handleGenerate = () => {
    const num = parseInt(count);
    if (!subcategory || isNaN(num) || num < 1) return;
    dispatch(generateUnits({ count: num, subcategory }));
  };

  const handleDeleteUnit = async (unit: InventoryUnit) => {
    if (!projectId) return;
    const ok = window.confirm(
      "Are you sure you want to delete this unit? This action cannot be undone.",
    );
    if (!ok) return;

    setDeletingUnitId(unit.id);
    try {
      const result = await deleteInventoryUnitFromDatabase(projectId, unit);
      if (!result.ok) {
        toast.error(result.error ?? "Could not delete unit");
        return;
      }

      dispatch(removeUnit(unit.id));
      toast.success("Unit deleted");
      if (editing?.id === unit.id) setEditing(null);
    } finally {
      setDeletingUnitId(null);
    }
  };

  return (
    <div className="space-y-6">
      {!generated && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>{subcat?.icon}</span>
              Setup {subcat?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter the total number of {unitLabel.toLowerCase()}s to
              auto-generate the inventory.
            </p>
            <div>
              <Label>Number of {unitLabel}s</Label>
              <Input
                type="number"
                min={1}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                placeholder="e.g. 50"
                className="mt-2"
              />
            </div>
            <Button
              className="w-full"
              disabled={!count || parseInt(count) < 1}
              onClick={handleGenerate}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate {unitLabel}s
            </Button>
          </CardContent>
        </Card>
      )}

      {generated && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_UI).map(([key, val]) => {
                const cnt = units.filter((u) => u.status === key).length;
                if (!cnt) return null;
                return (
                  <Badge key={key} variant="secondary" className={val.badge}>
                    {cnt} {val.label}
                  </Badge>
                );
              })}
              <Badge>{units.length} Total</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => dispatch(clearUnits())}
            >
              Reset & Reconfigure
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {units.map((unit) => {
              const style = STATUS_UI[unit.status] || STATUS_UI.available;
              const selected = selectedUnits.includes(unit.id);
              return (
                <Card
                  key={unit.id}
                  className={cn(
                    "relative cursor-pointer transition-all hover:shadow-md border-2 group",
                    style.cell,
                    selected &&
                      "ring-2 ring-primary ring-offset-2 border-primary",
                  )}
                  onClick={(e) =>
                    handleUnitSelectClick(e, unit.id, dispatch, {
                      selectOnly: selectOnlyUnit,
                      toggle: toggleUnitSelection,
                    })
                  }
                >
                  <Checkbox
                    checked={selected}
                    className="absolute top-2 left-2 z-10 h-4 w-4 bg-background"
                    onCheckedChange={() =>
                      dispatch(toggleUnitSelection(unit.id))
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <UnitCardActions
                    onEdit={() => setEditing(unit)}
                    onDelete={() => void handleDeleteUnit(unit)}
                    deleting={deletingUnitId === unit.id}
                  />
                  <CardContent className="p-4 pt-8">
                    {/* TODO: re-enable later — unit status display
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={cn("w-2 h-2 rounded-full", style.dot)} />
                      <span className="text-[10px] uppercase font-medium opacity-70">
                        {unit.status}
                      </span>
                    </div>
                    */}
                    <p className="font-bold truncate">{unit.unitName}</p>
                    {unit.area && (
                      <p className="text-xs mt-1 opacity-70">
                        {unit.area}{" "}
                        {unit.areaType === "sqft"
                          ? "sq.ft"
                          : unit.areaType === "sqyard"
                            ? "sq.yd"
                            : "acre"}
                      </p>
                    )}
                    {unit.price && (
                      <p className="text-xs font-semibold mt-0.5">
                        ₹{Number(unit.price).toLocaleString("en-IN")}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <UnitEditModal
        open={!!editing}
        unit={editing}
        projectId={projectId}
        unitLabel={unitLabel}
        onClose={() => setEditing(null)}
        onSave={async (fields) => {
          if (!editing || !projectId) return;

          const mergedUnit = { ...editing, ...fields };
          dispatch(updateUnit({ unitId: editing.id, fields }));

          const result = await persistSingleInventoryUnit(projectId, inventory, {
            unit: mergedUnit,
          });

          if (result.ok) {
            if (result.dbUnitId) {
              dispatch(
                updateUnit({
                  unitId: editing.id,
                  fields: { id: `db-${result.dbUnitId}` },
                }),
              );
            }
            toast.success("Unit details saved to database");
          } else {
            toast.error(result.error ?? "Could not save unit to database");
          }

          setEditing(null);
        }}
      />
    </div>
  );
};

export default SimpleUnitBuilder;

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
  generatePlots,
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
import { Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  deleteInventoryUnitFromDatabase,
  persistSingleInventoryUnit,
} from "./inventoryPersist";
import { toast } from "sonner";

const PlotBuilder = () => {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector((s) => s.inventory);
  const {
    projectType,
    subcategory,
    units,
    plotRows,
    plotCols,
    projectId,
    selectedUnits,
  } = inventory;
  const [rows, setRows] = useState(String(plotRows || 4));
  const [cols, setCols] = useState(String(plotCols || 5));
  const [editing, setEditing] = useState<InventoryUnit | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

  const subcat = getSubcategory(projectType, subcategory);
  const unitLabel = subcat?.unitLabel || "Plot";
  const generated = units.length > 0;

  const handleGenerate = () => {
    const r = parseInt(rows) || 4;
    const c = parseInt(cols) || 5;
    if (!subcategory) return;
    dispatch(generatePlots({ rows: r, cols: c, subcategory }));
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

  const statusCounts = Object.keys(STATUS_UI).reduce(
    (acc, key) => {
      acc[key] = units.filter((u) => u.status === key).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="space-y-6">
      {!generated && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Setup {subcat?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define the plot grid dimensions to auto-generate inventory.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rows</Label>
                <Input
                  type="number"
                  min={1}
                  value={rows}
                  onChange={(e) => setRows(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Columns</Label>
                <Input
                  type="number"
                  min={1}
                  value={cols}
                  onChange={(e) => setCols(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleGenerate}>
              Generate {parseInt(rows) * parseInt(cols) || 0} Plots
            </Button>
          </CardContent>
        </Card>
      )}

      {generated && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_UI).map(([key, val]) => (
                <Badge
                  key={key}
                  variant="outline"
                  className="flex items-center gap-1.5"
                >
                  <span className={cn("w-2 h-2 rounded-full", val.dot)} />
                  {statusCounts[key] || 0} {val.label}
                </Badge>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearUnits())}
            >
              Reset Grid
            </Button>
          </div>

          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${plotCols}, minmax(0, 1fr))`,
            }}
          >
            {units.map((plot) => {
              const style = STATUS_UI[plot.status] || STATUS_UI.available;
              const selected = selectedUnits.includes(plot.id);
              return (
                <div key={plot.id} className="relative group">
                  <Checkbox
                    checked={selected}
                    className="absolute top-1 left-1 z-10 h-3.5 w-3.5 bg-background"
                    onCheckedChange={() =>
                      dispatch(toggleUnitSelection(plot.id))
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    type="button"
                    onClick={(e) =>
                      handleUnitSelectClick(e, plot.id, dispatch, {
                        selectOnly: selectOnlyUnit,
                        toggle: toggleUnitSelection,
                      })
                    }
                    className={cn(
                      "aspect-square w-full rounded-lg border-2 flex flex-col items-center justify-center text-xs font-semibold transition-all hover:scale-105",
                      style.cell,
                      selected &&
                        "ring-2 ring-primary ring-offset-1 border-primary",
                    )}
                  >
                    <span>{plot.unitName}</span>
                  </button>
                  <UnitCardActions
                    size="compact"
                    onEdit={() => setEditing(plot)}
                    onDelete={() => void handleDeleteUnit(plot)}
                    deleting={deletingUnitId === plot.id}
                  />
                </div>
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

export default PlotBuilder;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addTower,
  generateTowers,
  scaffoldFloors,
  scaffoldUnits,
  selectOnlyUnit,
  setSelectedFloorNumber,
  setSelectedTowerId,
  toggleUnitSelection,
  removeUnit,
  removeFloor,
  removeTower,
  updateTowerUnit,
} from "@/store/slices/inventorySlice";
import type { InventoryFloor, InventoryTower, InventoryUnit } from "@/store/types/inventory";
import { formatFloorLabel, sortFloorsTopToBottom } from "@/utils/inventoryFloors";
import { store } from "@/store";
import {
  deleteInventoryFloorFromDatabase,
  deleteInventoryTowerFromDatabase,
  deleteInventoryUnitFromDatabase,
  persistSingleInventoryUnit,
  saveInventoryWithFeedback,
} from "./inventoryPersist";
import { handleUnitSelectClick } from "./unitSelectionUtils";
import UnitEditModal from "./UnitEditModal";
import UnitCardActions from "./UnitCardActions";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ChevronDown, Layers, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditTarget {
  tower: InventoryTower;
  floor: InventoryFloor;
  unit: InventoryUnit;
}

type DeleteTarget =
  | { kind: "tower"; tower: InventoryTower }
  | { kind: "floor"; tower: InventoryTower; floor: InventoryFloor };

const ApartmentBuilder = () => {
  const dispatch = useAppDispatch();
  const inventory = useAppSelector((s) => s.inventory);
  const {
    towers,
    selectedTowerId,
    selectedFloorNumber,
    selectedUnits,
    projectId,
  } = inventory;

  const [expandedTowers, setExpandedTowers] = useState<Record<string, boolean>>({});
  const [towerInput, setTowerInput] = useState("");
  const [towerCount, setTowerCount] = useState("3");
  const [basementCount, setBasementCount] = useState("0");
  const [hasGroundFloor, setHasGroundFloor] = useState(true);
  const [floorsAboveGround, setFloorsAboveGround] = useState("10");
  const [unitCount, setUnitCount] = useState("4");
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deletingStructure, setDeletingStructure] = useState(false);
  const [persistError, setPersistError] = useState("");
  const [persisting, setPersisting] = useState(false);

  const selectedTower = towers.find((t) => t.id === selectedTowerId);

  const persistNow = async (label: string) => {
    if (!projectId) {
      const message =
        "Cannot save inventory — project ID is missing. Re-open this project from Project Setup.";
      console.error(`[inventory:${label}]`, message);
      setPersistError(message);
      toast.error(message);
      return false;
    }

    setPersisting(true);
    setPersistError("");
    try {
      const current = store.getState().inventory;
      const result = await saveInventoryWithFeedback(projectId, current, label);
      if (!result.ok) {
        const errs = result.errors.join("; ");
        setPersistError(errs);
        toast.error(errs);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[inventory:${label}] unexpected error`, err);
      const errMsg = "Unexpected error while saving towers, floors, or units.";
      setPersistError(errMsg);
      toast.error(errMsg);
      return false;
    } finally {
      setPersisting(false);
    }
  };

  const toggleTower = (towerId: string) => {
    setExpandedTowers((p) => ({ ...p, [towerId]: !p[towerId] }));
    dispatch(setSelectedTowerId(towerId));
  };

  const selectFloor = (towerId: string, floorNumber: number) => {
    dispatch(setSelectedTowerId(towerId));
    dispatch(setSelectedFloorNumber(floorNumber));
    setExpandedTowers((p) => ({ ...p, [towerId]: true }));
  };

  const handleGenerateFloors = () => {
    if (!selectedTowerId) return;
    const basements = Math.max(0, parseInt(basementCount, 10) || 0);
    const above = Math.max(0, parseInt(floorsAboveGround, 10) || 0);
    if (basements === 0 && !hasGroundFloor && above === 0) {
      const errMsg = "Add at least one basement, enable Ground Floor, or set floors above ground.";
      setPersistError(errMsg);
      toast.error(errMsg);
      return;
    }
    dispatch(
      scaffoldFloors({
        towerId: selectedTowerId,
        basementCount: basements,
        hasGroundFloor,
        floorsAboveGround: above,
      }),
    );
    setExpandedTowers((p) => ({ ...p, [selectedTowerId]: true }));
    void persistNow("generate-floors");
  };

  const handleCreateTowers = () => {
    const count = parseInt(towerCount) || 3;
    dispatch(generateTowers(count));
    const expanded: Record<string, boolean> = {};
    for (let i = 0; i < Math.min(count, 26); i++) {
      expanded[`tower-${String.fromCharCode(97 + i)}`] = i === 0;
    }
    setExpandedTowers(expanded);
    void persistNow("create-towers");
  };

  const handleAddTower = () => {
    const name = towerInput.trim();
    if (!name) return;
    dispatch(addTower(name));
    setTowerInput("");
    void persistNow("add-tower");
  };

  const handleGenerateUnits = () => {
    if (!selectedTowerId || selectedFloorNumber === null) return;
    dispatch(
      scaffoldUnits({
        towerId: selectedTowerId,
        floorNumber: selectedFloorNumber,
        unitCount: parseInt(unitCount, 10) || 4,
      }),
    );
    void persistNow("generate-units");
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
        console.error("[inventory] unit delete failed:", result.error);
        return;
      }

      dispatch(removeUnit(unit.id));
      if (editing?.unit.id === unit.id) setEditing(null);
    } finally {
      setDeletingUnitId(null);
    }
  };

  const handleConfirmStructureDelete = async () => {
    if (!deleteTarget || !projectId) return;
    setDeletingStructure(true);
    setPersistError("");

    try {
      if (deleteTarget.kind === "tower") {
        const result = await deleteInventoryTowerFromDatabase(
          projectId,
          deleteTarget.tower,
        );
        if (!result.ok) {
          const errMsg = result.error ?? "Could not delete tower";
          setPersistError(errMsg);
          toast.error(errMsg);
          return;
        }
        dispatch(removeTower(deleteTarget.tower.id));
        if (editing?.tower.id === deleteTarget.tower.id) setEditing(null);
      } else {
        const result = await deleteInventoryFloorFromDatabase(
          projectId,
          deleteTarget.tower.name,
          deleteTarget.floor,
        );
        if (!result.ok) {
          const errMsg = result.error ?? "Could not delete floor";
          setPersistError(errMsg);
          toast.error(errMsg);
          return;
        }
        dispatch(
          removeFloor({
            towerId: deleteTarget.tower.id,
            floorNumber: deleteTarget.floor.number,
          }),
        );
        if (
          editing?.tower.id === deleteTarget.tower.id &&
          editing.floor.number === deleteTarget.floor.number
        ) {
          setEditing(null);
        }
      }
      setDeleteTarget(null);
    } finally {
      setDeletingStructure(false);
    }
  };

  return (
    <div className="space-y-6">
      {persisting && (
        <p className="text-xs text-muted-foreground">Saving inventory…</p>
      )}
      {towers.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Setup Towers & Blocks
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-6">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">
                Add Tower Manually
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={towerInput}
                  onChange={(e) => setTowerInput(e.target.value)}
                  placeholder="e.g. Tower A"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && towerInput.trim()) {
                      handleAddTower();
                    }
                  }}
                />
                <Button onClick={handleAddTower}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">
                Auto-Generate Towers
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="number"
                  min={1}
                  max={26}
                  value={towerCount}
                  onChange={(e) => setTowerCount(e.target.value)}
                  placeholder="3"
                />
                <Button variant="secondary" onClick={handleCreateTowers}>
                  Generate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {towers.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Towers ({towers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Input
                  value={towerInput}
                  onChange={(e) => setTowerInput(e.target.value)}
                  placeholder="Tower name..."
                />
                <Button size="icon" onClick={handleAddTower}>
                  <Plus className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card
              className={cn(
                selectedTowerId && "ring-1 ring-primary/20",
              )}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Create Floors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!selectedTowerId && (
                  <p className="text-xs text-muted-foreground">
                    Select a tower from the sidebar or list to configure floors.
                  </p>
                )}
                {selectedTower && (
                  <p className="text-xs text-primary font-medium">
                    Configuring: {selectedTower.name}
                  </p>
                )}
                <div>
                  <Label className="text-xs">Number of Basements</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={basementCount}
                    onChange={(e) => setBasementCount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={hasGroundFloor}
                    onCheckedChange={(c) => setHasGroundFloor(!!c)}
                  />
                  Ground Floor
                </label>
                <div>
                  <Label className="text-xs">Number of Floors (above ground)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={200}
                    value={floorsAboveGround}
                    onChange={(e) => setFloorsAboveGround(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  className="w-full"
                  disabled={!selectedTowerId}
                  onClick={handleGenerateFloors}
                >
                  Generate Floors
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Create Units</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedTower && selectedFloorNumber !== null && (
                  <p className="text-xs text-primary font-medium">
                    {selectedTower.name} ·{" "}
                    {formatFloorLabel(
                      selectedTower.floors.find(
                        (f) => f.number === selectedFloorNumber,
                      ) ?? { number: selectedFloorNumber },
                    )}
                  </p>
                )}
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={unitCount}
                  onChange={(e) => setUnitCount(e.target.value)}
                  placeholder="Units per floor"
                />
                <Button
                  className="w-full"
                  disabled={!selectedTowerId || selectedFloorNumber === null}
                  onClick={handleGenerateUnits}
                >
                  Generate Units
                </Button>
              </CardContent>
            </Card>

          </div>

          <div className="lg:col-span-8 space-y-4">
            {/* TODO: re-enable later — status legend
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {Object.entries(STATUS_UI).map(([key, val]) => (
                <span key={key} className="flex items-center gap-1.5">
                  <span className={cn("w-2.5 h-2.5 rounded-full", val.dot)} />
                  {val.label}
                </span>
              ))}
            </div>
            */}

            {towers.map((tower) => {
              const totalUnits = tower.floors.reduce(
                (s, f) => s + f.units.length,
                0,
              );
              const isExpanded = !!expandedTowers[tower.id];
              const isActiveTower = selectedTowerId === tower.id;

              return (
                <Collapsible
                  key={tower.id}
                  open={isExpanded}
                  onOpenChange={() => toggleTower(tower.id)}
                >
                  <Card
                    className={cn(
                      "overflow-hidden transition-colors",
                      isActiveTower && "ring-2 ring-primary border-primary/40",
                    )}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                            {tower.name.replace(/Tower\s*/i, "").charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold">{tower.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {tower.floors.length} floors · {totalUnits} units
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({ kind: "tower", tower });
                            }}
                            aria-label={`Delete ${tower.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              isExpanded && "rotate-180",
                            )}
                          />
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="border-t bg-muted/30 p-4 space-y-3">
                        {tower.floors.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No floors yet.
                          </p>
                        ) : (
                          sortFloorsTopToBottom(tower.floors).map((floor) => {
                            const isActiveFloor =
                              isActiveTower &&
                              selectedFloorNumber === floor.number;
                            return (
                            <div
                              key={floor.number}
                              className={cn(
                                "rounded-lg border p-3 transition-colors",
                                isActiveFloor
                                  ? "border-primary ring-1 ring-primary/30 bg-background"
                                  : "bg-card",
                              )}
                            >
                              <div className="flex items-center justify-between mb-2 gap-2">
                                <button
                                  type="button"
                                  className={cn(
                                    "flex-1 flex justify-between text-sm font-medium text-left",
                                    isActiveFloor && "text-primary",
                                  )}
                                  onClick={() => selectFloor(tower.id, floor.number)}
                                >
                                  <span>{formatFloorLabel(floor)}</span>
                                  <span className="text-muted-foreground text-xs">
                                    {floor.units.length} units
                                  </span>
                                </button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setDeleteTarget({
                                      kind: "floor",
                                      tower,
                                      floor,
                                    })
                                  }
                                  aria-label={`Delete ${formatFloorLabel(floor)}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                {floor.units.map((unit) => {
                                  const style = isActiveFloor
                                    ? {
                                        cell: "bg-background border-border text-foreground hover:bg-muted/20 shadow-sm",
                                      }
                                    : {
                                        cell: "bg-muted/40 border-border text-foreground hover:bg-muted/60",
                                      };
                                  const selected = selectedUnits.includes(
                                    unit.id,
                                  );
                                  return (
                                    <div key={unit.id} className="relative group">
                                      <Checkbox
                                        checked={selected}
                                        className="absolute -top-1.5 -left-1.5 z-10 h-4 w-4 bg-background border-primary data-[state=checked]:bg-primary"
                                        onCheckedChange={() =>
                                          dispatch(toggleUnitSelection(unit.id))
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <button
                                        type="button"
                                        onClick={(e) =>
                                          handleUnitSelectClick(
                                            e,
                                            unit.id,
                                            dispatch,
                                            {
                                              selectOnly: selectOnlyUnit,
                                              toggle: toggleUnitSelection,
                                            },
                                          )
                                        }
                                        className={cn(
                                          "w-full p-2 rounded-md border-2 text-xs font-bold transition-all",
                                          selected
                                            ? "ring-2 ring-primary ring-offset-2 border-primary bg-primary/10 text-primary"
                                            : style.cell,
                                        )}
                                      >
                                        {unit.unitName || unit.number}
                                      </button>
                                      <UnitCardActions
                                        size="compact"
                                        onEdit={() =>
                                          setEditing({
                                            tower,
                                            floor,
                                            unit,
                                          })
                                        }
                                        onDelete={() =>
                                          void handleDeleteUnit(unit)
                                        }
                                        deleting={deletingUnitId === unit.id}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                          })
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}

      <UnitEditModal
        open={!!editing}
        unit={editing?.unit ?? null}
        projectId={projectId}
        unitLabel="Unit"
        onClose={() => setEditing(null)}
        onSave={async (fields) => {
          if (!editing || !projectId) return;

          const mergedUnit = {
            ...editing.unit,
            ...fields,
            number: fields.unitName?.trim() || fields.number || editing.unit.number,
            unitName: fields.unitName?.trim() || fields.number || editing.unit.unitName,
          };
          dispatch(
            updateTowerUnit({
              towerId: editing.tower.id,
              floorNumber: editing.floor.number,
              unitId: editing.unit.id,
              fields: {
                ...fields,
                number: mergedUnit.number,
                unitName: mergedUnit.unitName,
              },
            }),
          );

          const result = await persistSingleInventoryUnit(projectId, inventory, {
            unit: mergedUnit,
            towerId: editing.tower.id,
            floorNumber: editing.floor.number,
          });

          if (result.ok) {
            if (result.dbUnitId) {
              dispatch(
                updateTowerUnit({
                  towerId: editing.tower.id,
                  floorNumber: editing.floor.number,
                  unitId: editing.unit.id,
                  fields: { id: `db-${result.dbUnitId}` },
                }),
              );
            }
            console.info("[inventory] unit details saved to database");
          } else {
            console.error("[inventory] unit save failed:", result.error);
          }

          setEditing(null);
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.kind === "tower"
                ? `Delete ${deleteTarget.tower.name}?`
                : `Delete ${deleteTarget?.kind === "floor" ? formatFloorLabel(deleteTarget.floor) : "floor"}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kind === "tower"
                ? "This will remove the tower, all its floors, and all units inside. This cannot be undone."
                : "This will remove the floor and all units on it. This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingStructure}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingStructure}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmStructureDelete();
              }}
            >
              {deletingStructure ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ApartmentBuilder;

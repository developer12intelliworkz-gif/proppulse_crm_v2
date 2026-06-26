import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import axiosInstance from "@/api/axiosInstance";
import type { AreaUnit, InventoryUnit } from "@/store/types/inventory";
import { AREA_UNIT_OPTIONS, FACING_OPTIONS } from "./inventoryConstants";
import { getUnitsWithLocationByIds } from "./unitSelectionUtils";
import type { InventoryState } from "@/store/types/inventory";
import { persistBulkInventoryUnits } from "./inventoryPersist";
import { CheckCircle2, Loader2, Pencil, RotateCcw, XCircle } from "lucide-react";

interface ProjectAmenity {
  id: number;
  name: string;
}

interface BulkFormState {
  area: string;
  super_builtup_area: string;
  areaUnit_carpet: AreaUnit;
  areaUnit_super: AreaUnit;
  base_rate: string;
  facing: string;
  has_parking: "no" | "yes";
  parking_count: string;
  amenities: string[];
}

interface BulkRowState extends BulkFormState {
  custom: boolean;
}

interface BulkUnitEditSheetProps {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  inventory: InventoryState;
  selectedUnitIds: string[];
  onSaved: (result: {
    patches: {
      unitId: string;
      fields: Partial<InventoryUnit>;
      towerId?: string;
      floorNumber?: number;
      dbUnitId?: string;
    }[];
    succeeded: number;
    failed: { label: string; error: string }[];
  }) => void;
}

const emptyForm = (): BulkFormState => ({
  area: "",
  super_builtup_area: "",
  areaUnit_carpet: "sqft",
  areaUnit_super: "sqft",
  base_rate: "",
  facing: "",
  has_parking: "no",
  parking_count: "",
  amenities: [],
});

const rowFromForm = (form: BulkFormState, custom = false): BulkRowState => ({
  ...form,
  amenities: [...form.amenities],
  custom,
});

const rowFromUnit = (unit: InventoryUnit, custom = false): BulkRowState => ({
  area: unit.area ?? "",
  super_builtup_area: unit.super_builtup_area ?? "",
  areaUnit_carpet: unit.areaUnit_carpet ?? "sqft",
  areaUnit_super: unit.areaUnit_super ?? "sqft",
  base_rate: unit.base_rate ?? "",
  facing: unit.facing ?? "",
  has_parking: unit.has_parking ? "yes" : "no",
  parking_count:
    unit.parking_count != null ? String(unit.parking_count) : "",
  amenities: [...(unit.amenities ?? [])],
  custom,
});

const computeTotalPrice = (
  carpet: string,
  superBuiltup: string,
  baseRate: string,
): number | null => {
  const carpetNum = Number(carpet) || 0;
  const superNum = Number(superBuiltup) || 0;
  const rate = Number(baseRate) || 0;
  if (rate <= 0) return null;
  const saleableArea = superNum > 0 ? superNum : carpetNum;
  return saleableArea * rate;
};

const buildSavePatch = (row: BulkFormState): Partial<InventoryUnit> => {
  const patch: Partial<InventoryUnit> = {};
  if (row.area.trim()) patch.area = row.area.trim();
  if (row.super_builtup_area.trim())
    patch.super_builtup_area = row.super_builtup_area.trim();
  patch.areaUnit_carpet = row.areaUnit_carpet;
  patch.areaUnit_super = row.areaUnit_super;
  if (row.base_rate.trim()) patch.base_rate = row.base_rate.trim();
  if (row.facing) patch.facing = row.facing;
  patch.has_parking = row.has_parking === "yes";
  patch.parking_count =
    row.has_parking === "yes" ? Number(row.parking_count) || null : null;
  if (row.amenities.length > 0) patch.amenities = row.amenities;

  const carpet = patch.area ?? "";
  const superBuilt = patch.super_builtup_area ?? "";
  const rate = patch.base_rate ?? "";
  const total = computeTotalPrice(carpet || "0", superBuilt || "0", rate || "0");
  if (total !== null) {
    patch.total_price = total;
    patch.price = String(total);
  }
  return patch;
};

type RowStatus = "pending" | "success" | "failed";

const BulkUnitEditSheet = ({
  open,
  onClose,
  projectId,
  inventory,
  selectedUnitIds,
  onSaved,
}: BulkUnitEditSheetProps) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BulkFormState>(emptyForm);
  const [rowData, setRowData] = useState<Record<string, BulkRowState>>({});
  const [projectAmenities, setProjectAmenities] = useState<ProjectAmenity[]>(
    [],
  );
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [tableVersion, setTableVersion] = useState(0);
  const formRef = useRef(form);
  const skipSyncRef = useRef(false);

  formRef.current = form;

  const selectedEntries = useMemo(
    () => getUnitsWithLocationByIds(inventory, selectedUnitIds),
    [inventory, selectedUnitIds],
  );

  const totalPrice = useMemo(
    () => computeTotalPrice(form.area, form.super_builtup_area, form.base_rate),
    [form.area, form.super_builtup_area, form.base_rate],
  );

  useEffect(() => {
    if (!open || !projectId) return;
    axiosInstance
      .get(`/projects/${projectId}/amenities`)
      .then((res) => {
        const rows = res.data?.data ?? [];
        setProjectAmenities(
          Array.isArray(rows)
            ? rows
                .filter((a) => a.is_selected !== false)
                .map((a) => ({ id: a.id, name: a.name }))
            : [],
        );
      })
      .catch(() => setProjectAmenities([]));
  }, [open, projectId]);

  const selectedIdsKey = selectedUnitIds.join(",");

  useEffect(() => {
    if (!open) {
      setForm(emptyForm());
      setRowData({});
      setRowStatus({});
      setRowErrors({});
      setTableVersion(0);
      skipSyncRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open || selectedEntries.length === 0) return;
    const initialRows: Record<string, BulkRowState> = {};
    for (const entry of selectedEntries) {
      initialRows[entry.unit.id] = rowFromUnit(entry.unit, false);
    }
    skipSyncRef.current = true;
    setRowData(initialRows);
    setRowStatus({});
    setRowErrors({});
  }, [open, selectedIdsKey]);

  useEffect(() => {
    if (!open) return;
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    setRowData((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const entry of selectedEntries) {
        const existing = next[entry.unit.id];
        if (!existing) {
          next[entry.unit.id] = rowFromForm(formRef.current, false);
          changed = true;
        } else if (!existing.custom) {
          const synced = rowFromForm(formRef.current, false);
          if (JSON.stringify(existing) !== JSON.stringify(synced)) {
            next[entry.unit.id] = synced;
            changed = true;
          }
        }
      }
      return changed ? next : prev;
    });
  }, [form, open, selectedIdsKey, selectedEntries]);

  const updateRow = (unitId: string, patch: Partial<BulkRowState>) => {
    setRowData((prev) => ({
      ...prev,
      [unitId]: {
        ...(prev[unitId] ?? rowFromForm(form, true)),
        ...patch,
        custom: true,
      },
    }));
  };

  const resetRowToForm = (unitId: string) => {
    skipSyncRef.current = true;
    const snapshot = {
      ...formRef.current,
      amenities: [...formRef.current.amenities],
    };
    setRowData((prev) => ({
      ...prev,
      [unitId]: rowFromForm(snapshot, false),
    }));
    setTableVersion((v) => v + 1);
    setRowStatus((prev) => {
      const next = { ...prev };
      delete next[unitId];
      return next;
    });
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[unitId];
      return next;
    });
  };

  const applyFormToAll = () => {
    skipSyncRef.current = true;
    const snapshot = {
      ...formRef.current,
      amenities: [...formRef.current.amenities],
    };
    setRowData(() => {
      const next: Record<string, BulkRowState> = {};
      for (const entry of selectedEntries) {
        next[entry.unit.id] = rowFromForm(snapshot, false);
      }
      return next;
    });
    setTableVersion((v) => v + 1);
    setRowStatus({});
    setRowErrors({});
  };

  const toggleAmenity = (name: string) => {
    setForm((f) => {
      const set = new Set(f.amenities);
      if (set.has(name)) set.delete(name);
      else set.add(name);
      return { ...f, amenities: Array.from(set) };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || selectedEntries.length < 2) return;

    setSaving(true);
    setRowStatus({});
    setRowErrors({});

    try {
      const targets = selectedEntries.map((entry) => {
        const row = rowData[entry.unit.id] ?? rowFromForm(form, false);
        const patch = buildSavePatch(row);
        return {
          unit: { ...entry.unit, ...patch } as InventoryUnit,
          towerId: entry.towerId,
          floorNumber: entry.floorNumber,
        };
      });

      const result = await persistBulkInventoryUnits(
        projectId,
        inventory,
        targets,
      );

      const succeededKeys = new Set(
        result.succeeded.map((s) =>
          (s.unit.number || s.unit.unitName || s.unit.id).toUpperCase(),
        ),
      );
      const failedMap = new Map(
        result.failed.map((f) => [
          (f.unit.number || f.unit.unitName || f.unit.id).toUpperCase(),
          f.error,
        ]),
      );

      const statusMap: Record<string, RowStatus> = {};
      const errorMap: Record<string, string> = {};
      for (const entry of selectedEntries) {
        const key = (
          entry.unit.number ||
          entry.unit.unitName ||
          entry.unit.id
        ).toUpperCase();
        if (succeededKeys.has(key)) {
          statusMap[entry.unit.id] = "success";
        } else if (failedMap.has(key)) {
          statusMap[entry.unit.id] = "failed";
          errorMap[entry.unit.id] = failedMap.get(key) || "Save failed";
        }
      }
      setRowStatus(statusMap);
      setRowErrors(errorMap);

      onSaved({
        patches: selectedEntries
          .filter((e) => statusMap[e.unit.id] === "success")
          .map((entry) => {
            const row = rowData[entry.unit.id] ?? rowFromForm(form, false);
            const patch = buildSavePatch(row);
            const saved = result.succeeded.find(
              (s) =>
                (s.unit.number || s.unit.unitName || "").toUpperCase() ===
                (entry.unit.number || entry.unit.unitName || "").toUpperCase(),
            );
            return {
              unitId: entry.unit.id,
              fields: patch,
              towerId: entry.towerId,
              floorNumber: entry.floorNumber,
              dbUnitId: saved?.unit.id.startsWith("db-")
                ? saved.unit.id.slice(3)
                : undefined,
            };
          }),
        succeeded: result.succeeded.length,
        failed: result.failed.map((f) => ({
          label: f.unit.number || f.unit.unitName || f.unit.id,
          error: f.error,
        })),
      });

      if (result.failed.length === 0) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const areaUnitLabel = (u: AreaUnit) =>
    AREA_UNIT_OPTIONS.find((o) => o.value === u)?.label ?? u;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl p-0 flex flex-col overflow-hidden"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0 text-left">
          <SheetTitle>Bulk edit {selectedUnitIds.length} units</SheetTitle>
          <SheetDescription>
            Set values in the form above — they apply to all units. Customize
            any row in the table below, then save.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Area & Pricing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Carpet Area</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min={0}
                      value={form.area}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, area: e.target.value }))
                      }
                      placeholder="1200"
                      className="flex-1 min-w-0"
                    />
                    <Select
                      value={form.areaUnit_carpet}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          areaUnit_carpet: v as AreaUnit,
                        }))
                      }
                    >
                      <SelectTrigger className="w-24 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AREA_UNIT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Super Builtup Area</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      min={0}
                      value={form.super_builtup_area}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          super_builtup_area: e.target.value,
                        }))
                      }
                      placeholder="1400"
                      className="flex-1 min-w-0"
                    />
                    <Select
                      value={form.areaUnit_super}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          areaUnit_super: v as AreaUnit,
                        }))
                      }
                    >
                      <SelectTrigger className="w-24 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AREA_UNIT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Base Rate (₹ / unit)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.base_rate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, base_rate: e.target.value }))
                    }
                    placeholder="5000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Total Price (₹)</Label>
                  <Input
                    readOnly
                    value={
                      totalPrice !== null
                        ? totalPrice.toLocaleString("en-IN")
                        : "—"
                    }
                    className="mt-1 bg-muted font-medium"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Super Builtup Area (or Carpet Area if empty) × Base Rate
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Facing</Label>
                  <Select
                    value={form.facing || "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        facing: v === "none" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {FACING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Parking</Label>
                  <RadioGroup
                    value={form.has_parking}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        has_parking: v as "yes" | "no",
                        parking_count: v === "no" ? "" : f.parking_count,
                      }))
                    }
                    className="flex gap-4 mt-2"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="no" id="bulk-parking-no" />
                      <Label htmlFor="bulk-parking-no">No</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yes" id="bulk-parking-yes" />
                      <Label htmlFor="bulk-parking-yes">Yes</Label>
                    </div>
                  </RadioGroup>
                  {form.has_parking === "yes" && (
                    <Input
                      type="number"
                      min={1}
                      value={form.parking_count}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          parking_count: e.target.value,
                        }))
                      }
                      placeholder="Slots"
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* Project Amenities section removed from unit creation & edit */}

            <Separator />

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Preview & customize — {selectedEntries.length} units
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    applyFormToAll();
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reset all to form
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Edit any cell to customize a row. Custom rows stay independent
                when you change the form above.
              </p>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap sticky left-0 bg-background z-10">
                        Unit
                      </TableHead>
                      <TableHead className="whitespace-nowrap min-w-[100px]">
                        Carpet
                      </TableHead>
                      <TableHead className="whitespace-nowrap min-w-[100px]">
                        Super
                      </TableHead>
                      <TableHead className="whitespace-nowrap min-w-[90px]">
                        Rate
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Total</TableHead>
                      <TableHead className="whitespace-nowrap min-w-[110px]">
                        Facing
                      </TableHead>
                      <TableHead className="whitespace-nowrap min-w-[80px]">
                        Parking
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody key={tableVersion}>
                    {selectedEntries.map((entry) => {
                      const unitId = entry.unit.id;
                      const row = rowData[unitId] ?? rowFromForm(form, false);
                      const status = rowStatus[unitId];
                      const label =
                        entry.unit.number ||
                        entry.unit.unitName ||
                        entry.unit.id;
                      const rowTotal = computeTotalPrice(
                        row.area,
                        row.super_builtup_area,
                        row.base_rate,
                      );

                      return (
                        <TableRow
                          key={unitId}
                          className={row.custom ? "bg-muted/30" : undefined}
                        >
                          <TableCell className="font-medium whitespace-nowrap sticky left-0 bg-inherit z-10">
                            <div className="flex items-center gap-1.5">
                              <span>{label}</span>
                              {row.custom && (
                                <Badge variant="secondary" className="text-[10px] px-1">
                                  Custom
                                </Badge>
                              )}
                              {status === "success" && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              )}
                              {status === "failed" && (
                                <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                title="Reset row to form values"
                                onClick={() => resetRowToForm(unitId)}
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            </div>
                            {rowErrors[unitId] && (
                              <p className="text-destructive text-xs mt-0.5 max-w-[140px]">
                                {rowErrors[unitId]}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={row.area}
                              onChange={(e) =>
                                updateRow(unitId, { area: e.target.value })
                              }
                              className="h-8 w-24"
                              placeholder="—"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={row.super_builtup_area}
                              onChange={(e) =>
                                updateRow(unitId, {
                                  super_builtup_area: e.target.value,
                                })
                              }
                              className="h-8 w-24"
                              placeholder="—"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              value={row.base_rate}
                              onChange={(e) =>
                                updateRow(unitId, { base_rate: e.target.value })
                              }
                              className="h-8 w-24"
                              placeholder="—"
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">
                            {rowTotal != null
                              ? `₹${rowTotal.toLocaleString("en-IN")}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.facing || "none"}
                              onValueChange={(v) =>
                                updateRow(unitId, {
                                  facing: v === "none" ? "" : v,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">—</SelectItem>
                                {FACING_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={row.has_parking}
                              onValueChange={(v) =>
                                updateRow(unitId, {
                                  has_parking: v as "yes" | "no",
                                  parking_count:
                                    v === "no" ? "" : row.parking_count,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no">No</SelectItem>
                                <SelectItem value="yes">Yes</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-muted-foreground">
                Units use {areaUnitLabel(form.areaUnit_carpet)} for carpet and{" "}
                {areaUnitLabel(form.areaUnit_super)} for super builtup.
              </p>
            </section>
          </div>

          <SheetFooter className="shrink-0 px-6 py-4 border-t flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Save all units
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default BulkUnitEditSheet;

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/api/axiosInstance";
import type { AreaUnit, InventoryUnit, UnitStatus } from "@/store/types/inventory";
import {
  FACING_OPTIONS,
  STATUS_OPTIONS,
} from "./inventoryConstants";
import {
  getUnitsWithLocationByIds,
  uniformStatus,
  uniformStringField,
  type UnitWithLocation,
} from "./unitSelectionUtils";
import type { InventoryState } from "@/store/types/inventory";
import { persistBulkInventoryUnits } from "./inventoryPersist";
import { Loader2 } from "lucide-react";

const NO_CHANGE = "__no_change__";

interface BulkUnitEditModalProps {
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

const BulkUnitEditModal = ({
  open,
  onClose,
  projectId,
  inventory,
  selectedUnitIds,
  onSaved,
}: BulkUnitEditModalProps) => {
  const [saving, setSaving] = useState(false);
  const [unitTypes, setUnitTypes] = useState<
    { id: number; label: string | null; unit_name: string }[]
  >([]);

  const selectedEntries = useMemo(
    () => getUnitsWithLocationByIds(inventory, selectedUnitIds),
    [inventory, selectedUnitIds],
  );
  const selectedUnits = useMemo(
    () => selectedEntries.map((e) => e.unit),
    [selectedEntries],
  );

  const [form, setForm] = useState({
    status: NO_CHANGE,
    area: "",
    super_builtup_area: "",
    areaUnit_carpet: NO_CHANGE,
    areaUnit_super: NO_CHANGE,
    base_rate: "",
    facing: NO_CHANGE,
    unit_type_id: NO_CHANGE,
    has_parking: NO_CHANGE,
    parking_count: "",
  });

  const areaUniform = uniformStringField(selectedUnits, "area");
  const superUniform = uniformStringField(selectedUnits, "super_builtup_area");
  const rateUniform = uniformStringField(selectedUnits, "base_rate");
  const statusUniform = uniformStatus(selectedUnits);
  const facingUniform = uniformStringField(selectedUnits, "facing");

  useEffect(() => {
    if (!open || !projectId) return;
    axiosInstance
      .get(`/projects/${projectId}/unit-type-labels`)
      .then((res) => {
        const rows = res.data?.data ?? [];
        setUnitTypes(Array.isArray(rows) ? rows : []);
      })
      .catch(() => setUnitTypes([]));
  }, [open, projectId]);

  useEffect(() => {
    if (!open) return;
    setForm({
      status: statusUniform.uniform ? statusUniform.value || NO_CHANGE : NO_CHANGE,
      area: areaUniform.uniform ? areaUniform.value : "",
      super_builtup_area: superUniform.uniform ? superUniform.value : "",
      areaUnit_carpet: NO_CHANGE,
      areaUnit_super: NO_CHANGE,
      base_rate: rateUniform.uniform ? rateUniform.value : "",
      facing: facingUniform.uniform && facingUniform.value
        ? facingUniform.value
        : NO_CHANGE,
      unit_type_id: NO_CHANGE,
      has_parking: NO_CHANGE,
      parking_count: "",
    });
  }, [open, areaUniform, superUniform, rateUniform, statusUniform, facingUniform]);

  const buildFieldsPatch = (
    unit: InventoryUnit,
  ): Partial<InventoryUnit> | null => {
    const patch: Partial<InventoryUnit> = {};
    let changed = false;

    if (form.status !== NO_CHANGE) {
      patch.status = form.status as UnitStatus;
      changed = true;
    }
    if (form.area.trim() !== "") {
      patch.area = form.area.trim();
      changed = true;
    }
    if (form.super_builtup_area.trim() !== "") {
      patch.super_builtup_area = form.super_builtup_area.trim();
      changed = true;
    }
    if (form.areaUnit_carpet !== NO_CHANGE) {
      patch.areaUnit_carpet = form.areaUnit_carpet as AreaUnit;
      changed = true;
    }
    if (form.areaUnit_super !== NO_CHANGE) {
      patch.areaUnit_super = form.areaUnit_super as AreaUnit;
      changed = true;
    }
    if (form.base_rate.trim() !== "") {
      patch.base_rate = form.base_rate.trim();
      changed = true;
    }
    if (form.facing !== NO_CHANGE) {
      patch.facing = form.facing === "none" ? null : form.facing;
      changed = true;
    }
    if (form.unit_type_id !== NO_CHANGE) {
      patch.unit_type_id = Number(form.unit_type_id);
      changed = true;
    }
    if (form.has_parking !== NO_CHANGE) {
      patch.has_parking = form.has_parking === "yes";
      patch.parking_count =
        form.has_parking === "yes"
          ? Number(form.parking_count) || null
          : null;
      changed = true;
    } else if (form.parking_count.trim() !== "" && unit.has_parking) {
      patch.parking_count = Number(form.parking_count) || null;
      changed = true;
    }

    const carpet = patch.area ?? unit.area;
    const superBuilt = patch.super_builtup_area ?? unit.super_builtup_area;
    const rate = patch.base_rate ?? unit.base_rate;
    if (patch.base_rate !== undefined || patch.area !== undefined || patch.super_builtup_area !== undefined) {
      const total = computeTotalPrice(carpet, superBuilt, rate);
      if (total !== null) {
        patch.total_price = total;
        patch.price = String(total);
        changed = true;
      }
    }

    return changed ? patch : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || selectedEntries.length < 2) return;

    const patches: {
      entry: UnitWithLocation;
      fields: Partial<InventoryUnit>;
    }[] = [];

    for (const entry of selectedEntries) {
      const fields = buildFieldsPatch(entry.unit);
      if (fields) {
        patches.push({ entry, fields });
      }
    }

    if (patches.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const targets = patches.map(({ entry, fields }) => ({
        unit: { ...entry.unit, ...fields } as InventoryUnit,
        towerId: entry.towerId,
        floorNumber: entry.floorNumber,
      }));

      const result = await persistBulkInventoryUnits(
        projectId,
        inventory,
        targets,
      );

      const succeededNumbers = new Set(
        result.succeeded.map((s) =>
          (s.unit.number || s.unit.unitName || "").toUpperCase(),
        ),
      );

      onSaved({
        patches: patches
          .filter((p) =>
            succeededNumbers.has(
              (p.entry.unit.number || p.entry.unit.unitName || "").toUpperCase(),
            ),
          )
          .map((p) => {
            const saved = result.succeeded.find(
              (s) =>
                (s.unit.number || s.unit.unitName || "").toUpperCase() ===
                (p.entry.unit.number || p.entry.unit.unitName || "").toUpperCase(),
            );
            return {
              unitId: p.entry.unit.id,
              fields: {
                ...p.fields,
                ...(saved?.unit.id.startsWith("db-")
                  ? { id: saved.unit.id }
                  : {}),
              },
              towerId: p.entry.towerId,
              floorNumber: p.entry.floorNumber,
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
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const mixed = (uniform: boolean) => !uniform;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk edit {selectedUnitIds.length} units</DialogTitle>
          <DialogDescription>
            Leave a field empty or set to &quot;No change&quot; to keep existing
            values. Only filled fields are applied to all selected units.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue
                    placeholder={
                      mixed(statusUniform.uniform)
                        ? "Mixed values — choose to apply"
                        : "No change"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CHANGE}>No change</SelectItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Carpet area</Label>
              <Input
                className="mt-1"
                value={form.area}
                onChange={(e) =>
                  setForm((f) => ({ ...f, area: e.target.value }))
                }
                placeholder={
                  mixed(areaUniform.uniform) ? "Mixed values" : "No change"
                }
              />
            </div>
            <div>
              <Label>Super built-up area</Label>
              <Input
                className="mt-1"
                value={form.super_builtup_area}
                onChange={(e) =>
                  setForm((f) => ({ ...f, super_builtup_area: e.target.value }))
                }
                placeholder={
                  mixed(superUniform.uniform) ? "Mixed values" : "No change"
                }
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Base rate (₹ per sq.ft)</Label>
              <Input
                className="mt-1"
                value={form.base_rate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, base_rate: e.target.value }))
                }
                placeholder={
                  mixed(rateUniform.uniform) ? "Mixed values" : "No change"
                }
              />
            </div>

            <div>
              <Label>Facing</Label>
              <Select
                value={form.facing}
                onValueChange={(v) => setForm((f) => ({ ...f, facing: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue
                    placeholder={
                      mixed(facingUniform.uniform)
                        ? "Mixed values"
                        : "No change"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CHANGE}>No change</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                  {FACING_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Unit type</Label>
              <Select
                value={form.unit_type_id}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, unit_type_id: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CHANGE}>No change</SelectItem>
                  {unitTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.label?.trim() || t.unit_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Parking</Label>
              <Select
                value={form.has_parking}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, has_parking: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No change" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CHANGE}>No change</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parking count</Label>
              <Input
                className="mt-1"
                type="number"
                min={1}
                value={form.parking_count}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parking_count: e.target.value }))
                }
                placeholder="No change"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
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
                `Apply to ${selectedUnitIds.length} units`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUnitEditModal;

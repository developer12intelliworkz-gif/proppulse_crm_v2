import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import axiosInstance from "@/api/axiosInstance";
import type {
  AreaFieldsMode,
  AreaUnit,
  InventoryUnit,
  UnitStatus,
} from "@/store/types/inventory";
import { FACING_OPTIONS, getAreaUnitLabel } from "./inventoryConstants";
import {
  computeTotalPriceFromSqft,
  normalizeAreaFieldsMode,
  normalizeAreaUnitCode,
  toCanonicalSqft,
} from "@/utils/areaConversion";

interface UnitTypeOption {
  id: number;
  label: string | null;
  unit_name: string;
  area_fields_mode?: string | null;
}

interface UnitEditModalProps {
  open: boolean;
  unit: InventoryUnit | null;
  projectId: string | null;
  unitLabel?: string;
  onSave: (fields: Partial<InventoryUnit>) => void;
  onClose: () => void;
}

const UnitEditModal = ({
  open,
  unit,
  projectId,
  unitLabel = "Unit",
  onSave,
  onClose,
}: UnitEditModalProps) => {
  const [unitTypes, setUnitTypes] = useState<UnitTypeOption[]>([]);
  const [unitTypesLoaded, setUnitTypesLoaded] = useState(false);
  const [projectAreaUnit, setProjectAreaUnit] = useState<AreaUnit>("sqft");
  const [form, setForm] = useState({
    unitName: "",
    areaValue: "",
    base_rate: "",
    unit_type_id: "" as string,
    facing: "",
    has_parking: "no" as "yes" | "no",
    parking_count: "",
    status: "available" as UnitStatus,
    notes: "",
  });

  useEffect(() => {
    if (!open || !projectId) {
      setUnitTypes([]);
      setUnitTypesLoaded(false);
      return;
    }

    setUnitTypesLoaded(false);
    Promise.all([
      axiosInstance.get(`/projects/${projectId}/unit-type-labels`),
      axiosInstance.get(`/projects/${projectId}`),
    ])
      .then(([typesRes, projectRes]) => {
        const rows = typesRes.data?.data ?? [];
        setUnitTypes(Array.isArray(rows) ? rows : []);
        const projectRow = projectRes.data?.data ?? projectRes.data;
        setProjectAreaUnit(
          normalizeAreaUnitCode(projectRow?.default_area_unit) as AreaUnit,
        );
      })
      .catch(() => {
        setUnitTypes([]);
        setProjectAreaUnit("sqft");
      })
      .finally(() => setUnitTypesLoaded(true));
  }, [open, projectId]);

  const selectedUnitType = useMemo(
    () => unitTypes.find((t) => String(t.id) === form.unit_type_id) ?? null,
    [unitTypes, form.unit_type_id],
  );

  const areaFieldsMode: AreaFieldsMode = useMemo(
    () => normalizeAreaFieldsMode(selectedUnitType?.area_fields_mode),
    [selectedUnitType],
  );

  const isSuperMode = areaFieldsMode === "super_only";
  const areaFieldLabel = isSuperMode ? "Super Builtup Area" : "Carpet Area";
  const areaUnitLabel = getAreaUnitLabel(projectAreaUnit);

  useEffect(() => {
    if (!open) return;

    const mode = unit?.unit_type_id
      ? normalizeAreaFieldsMode(
          unitTypes.find((t) => String(t.id) === String(unit.unit_type_id))
            ?.area_fields_mode,
        )
      : "carpet_only";
    const superMode = mode === "super_only";

    if (unit) {
      setForm({
        unitName: unit.unitName || unit.number || "",
        areaValue: superMode
          ? unit.super_builtup_area || ""
          : unit.area || "",
        base_rate: unit.base_rate || "",
        unit_type_id:
          unit.unit_type_id != null ? String(unit.unit_type_id) : "",
        facing: unit.facing || "",
        has_parking: unit.has_parking ? "yes" : "no",
        parking_count:
          unit.parking_count != null ? String(unit.parking_count) : "",
        status: unit.status || "available",
        notes: unit.notes || "",
      });
      return;
    }

    setForm({
      unitName: "",
      areaValue: "",
      base_rate: "",
      unit_type_id: "",
      facing: "",
      has_parking: "no",
      parking_count: "",
      status: "available",
      notes: "",
    });
  }, [unit, open, unitTypes]);

  useEffect(() => {
    if (!unitTypesLoaded || form.unit_type_id) return;
    if (unitTypes.length === 1) {
      setForm((f) => ({ ...f, unit_type_id: String(unitTypes[0].id) }));
    }
  }, [unitTypesLoaded, unitTypes, form.unit_type_id]);

  const unitTypeSelectValue = useMemo(() => {
    if (!form.unit_type_id || !unitTypesLoaded) return "";
    const exists = unitTypes.some(
      (t) => String(t.id) === String(form.unit_type_id),
    );
    return exists ? String(form.unit_type_id) : "";
  }, [form.unit_type_id, unitTypes, unitTypesLoaded]);

  const totalPrice = useMemo(() => {
    const entry = Number(form.areaValue) || 0;
    const rate = Number(form.base_rate) || 0;
    if (entry <= 0 || rate <= 0) return null;
    const sqft = toCanonicalSqft(entry, projectAreaUnit);
    return computeTotalPriceFromSqft(sqft, rate);
  }, [form.areaValue, form.base_rate, projectAreaUnit]);

  const handleUnitTypeChange = (typeId: string) => {
    const type = unitTypes.find((t) => String(t.id) === typeId);
    const newMode = normalizeAreaFieldsMode(type?.area_fields_mode);
    const wasSuper = areaFieldsMode === "super_only";
    const nowSuper = newMode === "super_only";

    setForm((f) => {
      let areaValue = f.areaValue;
      if (wasSuper !== nowSuper && unit) {
        areaValue = nowSuper ? unit.super_builtup_area || "" : unit.area || "";
      }
      return { ...f, unit_type_id: typeId, areaValue };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unit_type_id || !form.areaValue.trim()) return;

    const displayName = form.unitName.trim();

    onSave({
      unitName: displayName || unit?.unitName || unit?.number || "",
      number: displayName || unit?.number || "",
      area: isSuperMode ? "" : form.areaValue,
      super_builtup_area: isSuperMode ? form.areaValue : "",
      areaUnit_carpet: projectAreaUnit,
      areaUnit_super: projectAreaUnit,
      base_rate: form.base_rate,
      total_price: totalPrice,
      price: totalPrice !== null ? String(totalPrice) : "",
      unit_type_id: Number(form.unit_type_id),
      facing: form.facing || null,
      has_parking: form.has_parking === "yes",
      parking_count:
        form.has_parking === "yes" ? Number(form.parking_count) || null : null,
      status: form.status,
      amenities: unit?.amenities ?? [],
      notes: form.notes,
    });
  };

  const typeLabel = (row: UnitTypeOption) =>
    row.label?.trim() || row.unit_name;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 gap-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-muted/30 text-left">
          <SheetTitle className="text-xl">
            {unit?.number
              ? `Edit ${unitLabel} ${unit.number}`
              : `Create ${unitLabel}`}
          </SheetTitle>
          <SheetDescription>
            Changes are saved to the database when you submit this form.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6 pb-24">
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Identity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Unit Type *</Label>
                <Select
                  key={`unit-type-${unit?.id ?? "new"}-${unitTypes.length}-${unitTypeSelectValue}`}
                  value={unitTypeSelectValue}
                  onValueChange={handleUnitTypeChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select unit type" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {typeLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Display Name</Label>
                <Input
                  value={form.unitName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unitName: e.target.value }))
                  }
                  placeholder={`e.g. ${unitLabel} A1`}
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Area & Pricing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>
                  {areaFieldLabel} *{" "}
                  <span className="text-muted-foreground font-normal">
                    ({areaUnitLabel})
                  </span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={form.areaValue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, areaValue: e.target.value }))
                  }
                  placeholder="1200"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Area unit is set at project level ({areaUnitLabel}). Values
                  are stored internally in sq.ft.
                </p>
              </div>

              <div>
                <Label>Base Rate (₹ / sq.ft)</Label>
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
                  {areaFieldLabel} × Base Rate (canonical sq.ft)
                </p>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="parking-no" />
                    <Label htmlFor="parking-no">No</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="parking-yes" />
                    <Label htmlFor="parking-yes">Yes</Label>
                  </div>
                </RadioGroup>
              </div>

              {form.has_parking === "yes" && (
                <div>
                  <Label>Parking Slots</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.parking_count}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, parking_count: e.target.value }))
                    }
                    placeholder="1"
                    className="mt-1"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Optional notes..."
                  rows={2}
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          <SheetFooter className="fixed bottom-0 left-0 right-0 sm:left-auto sm:w-full sm:max-w-xl md:max-w-2xl px-6 py-4 border-t bg-background flex-row justify-between gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!unitTypeSelectValue || !form.areaValue.trim()}
            >
              Save Unit
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default UnitEditModal;

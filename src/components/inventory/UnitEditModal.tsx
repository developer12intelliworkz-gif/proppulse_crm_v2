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
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import axiosInstance from "@/api/axiosInstance";
import type { AreaUnit, InventoryUnit, UnitStatus } from "@/store/types/inventory";
import {
  AREA_UNIT_OPTIONS,
  FACING_OPTIONS,
  STATUS_OPTIONS,
} from "./inventoryConstants";

interface UnitTypeOption {
  id: number;
  label: string | null;
  unit_name: string;
}

interface UnitEditModalProps {
  open: boolean;
  unit: InventoryUnit | null;
  projectId: string | null;
  unitLabel?: string;
  onSave: (fields: Partial<InventoryUnit>) => void;
  onClose: () => void;
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

const UnitEditModal = ({
  open,
  unit,
  projectId,
  unitLabel = "Unit",
  onSave,
  onClose,
}: UnitEditModalProps) => {
  const [unitTypes, setUnitTypes] = useState<UnitTypeOption[]>([]);
  const [projectAmenities, setProjectAmenities] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [form, setForm] = useState({
    unitName: "",
    area: "",
    super_builtup_area: "",
    areaUnit_carpet: "sqft" as AreaUnit,
    areaUnit_super: "sqft" as AreaUnit,
    base_rate: "",
    unit_type_id: "" as string,
    facing: "",
    has_parking: "no" as "yes" | "no",
    parking_count: "",
    status: "available" as UnitStatus,
    notes: "",
  });

  useEffect(() => {
    if (!open || !projectId) return;
    Promise.all([
      axiosInstance.get(`/projects/${projectId}/unit-type-labels`),
      axiosInstance.get(`/projects/${projectId}/amenities`),
    ])
      .then(([typesRes, amenitiesRes]) => {
        const rows = typesRes.data?.data ?? [];
        setUnitTypes(Array.isArray(rows) ? rows : []);
        const amenities = amenitiesRes.data?.data ?? [];
        setProjectAmenities(
          Array.isArray(amenities)
            ? amenities
                .filter((a) => a.is_selected !== false)
                .map((a) => ({ id: a.id, name: a.name }))
            : [],
        );
      })
      .catch(() => {
        setUnitTypes([]);
        setProjectAmenities([]);
      });
  }, [open, projectId]);

  useEffect(() => {
    if (unit) {
      setForm({
        unitName: unit.unitName || unit.number || "",
        area: unit.area || "",
        super_builtup_area: unit.super_builtup_area || "",
        areaUnit_carpet: unit.areaUnit_carpet || "sqft",
        areaUnit_super: unit.areaUnit_super || "sqft",
        base_rate: unit.base_rate || "",
        unit_type_id: unit.unit_type_id ? String(unit.unit_type_id) : "",
        facing: unit.facing || "",
        has_parking: unit.has_parking ? "yes" : "no",
        parking_count:
          unit.parking_count !== null && unit.parking_count !== undefined
            ? String(unit.parking_count)
            : "",
        status: unit.status || "available",
        notes: unit.notes || "",
      });
      setSelectedAmenities(unit.amenities ?? []);
    }
  }, [unit]);

  useEffect(() => {
    if (unitTypes.length === 1 && !form.unit_type_id) {
      setForm((f) => ({ ...f, unit_type_id: String(unitTypes[0].id) }));
    }
  }, [unitTypes, form.unit_type_id]);

  const totalPrice = useMemo(
    () => computeTotalPrice(form.area, form.super_builtup_area, form.base_rate),
    [form.area, form.super_builtup_area, form.base_rate],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unit_type_id) return;

    const displayName = form.unitName.trim();

    onSave({
      unitName: displayName || unit?.unitName || unit?.number || "",
      number: displayName || unit?.number || "",
      area: form.area,
      super_builtup_area: form.super_builtup_area,
      areaUnit_carpet: form.areaUnit_carpet,
      areaUnit_super: form.areaUnit_super,
      base_rate: form.base_rate,
      total_price: totalPrice,
      price: totalPrice !== null ? String(totalPrice) : "",
      unit_type_id: Number(form.unit_type_id),
      facing: form.facing || null,
      has_parking: form.has_parking === "yes",
      parking_count:
        form.has_parking === "yes" ? Number(form.parking_count) || null : null,
      status: form.status,
      amenities: selectedAmenities,
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
            {unit?.number ? `Edit ${unitLabel} ${unit.number}` : `Create ${unitLabel}`}
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
                  value={form.unit_type_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, unit_type_id: v }))}
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
              <div>
                <Label>Carpet Area *</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={form.area}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, area: e.target.value }))
                    }
                    placeholder="1200"
                    className="flex-1"
                  />
                  <Select
                    value={form.areaUnit_carpet}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, areaUnit_carpet: v as AreaUnit }))
                    }
                  >
                    <SelectTrigger className="w-28">
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
                <Label>Super Builtup</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={form.super_builtup_area}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, super_builtup_area: e.target.value }))
                    }
                    placeholder="1400"
                    className="flex-1"
                  />
                  <Select
                    value={form.areaUnit_super}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, areaUnit_super: v as AreaUnit }))
                    }
                  >
                    <SelectTrigger className="w-28">
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

              {/* Project Amenities section removed from unit creation & edit */}

              {/* TODO: re-enable later — unit status UI temporarily hidden
              <div className="sm:col-span-2">
                <Label>Status</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STATUS_OPTIONS.map((s) => (
                    <Badge
                      key={s.value}
                      variant={form.status === s.value ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1"
                      onClick={() =>
                        setForm((f) => ({ ...f, status: s.value as UnitStatus }))
                      }
                    >
                      {s.label}
                    </Badge>
                  ))}
                </div>
              </div>
              */}

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
            <Button type="submit" disabled={!form.unit_type_id}>
              Save Unit
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default UnitEditModal;

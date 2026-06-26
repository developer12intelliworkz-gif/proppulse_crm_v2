// src/components/projects/setup/UnitForm.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { UnitFormValues } from "./unitTypes";
import {
  formatUnitTypeLabel,
  getAllowedUnitTypeCodes,
  getAllowedUnitTypeLabels,
  resolveUnitTypeId,
  type UnitTypeOption,
} from "./unitTypeHelpers";

interface LeadOption {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

interface UnitFormProps {
  open: boolean;
  unit?: UnitFormValues | null;
  projectId: string;
  projectType?: string | null;
  projectStructure?: string | null;
  hierarchyTypeCode?: string | null;
  onClose: () => void;
  onSave: (unit: UnitFormValues) => void | Promise<void>;
  saving?: boolean;
}

const getInitialFormState = (unit?: UnitFormValues | null): UnitFormValues => ({
  id: unit?.id,
  unit_number: unit?.unit_number || "",
  unit_type_id: unit?.unit_type_id || null,
  status: unit?.status || "available",
  carpet_area_sqft: unit?.carpet_area_sqft || 0,
  super_builtup_area_sqft: unit?.super_builtup_area_sqft || 0,
  facing: unit?.facing || "",
  amenities: unit?.amenities || [],
  price: unit?.price || 0,
  lead_id: unit?.lead_id || null,
});

const UnitForm = ({
  open,
  unit,
  projectId,
  projectType,
  projectStructure,
  hierarchyTypeCode,
  onClose,
  onSave,
  saving = false,
}: UnitFormProps) => {
  const [form, setForm] = useState<UnitFormValues>(() =>
    getInitialFormState(unit),
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [duplicateUnitError, setDuplicateUnitError] = useState<string | null>(
    null,
  );
  const [projectUnits, setProjectUnits] = useState<
    { id: string; unit_number: string }[]
  >([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [unitTypes, setUnitTypes] = useState<UnitTypeOption[]>([]);
  const [loadingUnitTypes, setLoadingUnitTypes] = useState(false);
  const [resolvedTypeLabel, setResolvedTypeLabel] = useState<string | null>(
    null,
  );

  const allowedTypeLabels = getAllowedUnitTypeLabels(
    projectType,
    projectStructure,
  );

  const commonAmenities = [
    "Balcony",
    "Parking",
    "Garden View",
    "Corner",
    "Modular Kitchen",
    "Lift",
  ];

  useEffect(() => {
    if (!open || !projectId) return;

    const loadProjectUnits = async () => {
      try {
        const res = await axiosInstance.get(`/projects/${projectId}/units`);
        const rows = res.data?.data ?? [];
        setProjectUnits(
          (Array.isArray(rows) ? rows : []).map(
            (row: { id: string | number; unit_number?: string }) => ({
              id: String(row.id),
              unit_number: String(row.unit_number ?? "").trim(),
            }),
          ),
        );
      } catch {
        setProjectUnits([]);
      }
    };

    void loadProjectUnits();
  }, [open, projectId]);

  const checkDuplicateUnitNumber = (
    value: string,
    editingUnitId?: string | number,
  ): boolean => {
    const normalized = value.trim().toUpperCase();
    if (!normalized) return false;
    return projectUnits.some(
      (row) =>
        row.unit_number.trim().toUpperCase() === normalized &&
        String(row.id) !== String(editingUnitId ?? ""),
    );
  };

  const handleUnitNumberChange = (value: string) => {
    setForm((prev) => ({ ...prev, unit_number: value }));
    if (!value.trim()) {
      setDuplicateUnitError(null);
      return;
    }
    if (checkDuplicateUnitNumber(value, unit?.id)) {
      setDuplicateUnitError("This unit number already exists");
    } else {
      setDuplicateUnitError(null);
    }
  };

  useEffect(() => {
    if (!open || !projectId) return;

    const fetchProjectLeads = async () => {
      setLoadingLeads(true);
      try {
        const res = await axiosInstance.get("/leads", {
          params: {
            interested_project_id: projectId,
            page: 1,
            limit: 500,
          },
        });
        const data = res.data.data || [];
        setLeads(
          data.map((lead: LeadOption) => ({
            id: lead.id,
            name: lead.name || "Unnamed",
            phone: lead.phone,
            email: lead.email,
          })),
        );
      } catch (err) {
        console.error("Failed to load project leads:", err);
      } finally {
        setLoadingLeads(false);
      }
    };

    void fetchProjectLeads();
  }, [open, projectId]);

  useEffect(() => {
    if (!open || !projectId) return;

    const loadUnitTypes = async () => {
      setLoadingUnitTypes(true);
      try {
        const res = await axiosInstance.get(
          `/projects/${projectId}/unit-types`,
        );
        const data = res.data?.data || [];
        const formatted: UnitTypeOption[] = (
          Array.isArray(data) ? data : []
        ).map((t: { id: string | number; unit_name: string }) => ({
          id: String(t.id),
          unit_name: String(t.unit_name ?? ""),
        }));
        setUnitTypes(formatted);

        const allowedCodes = getAllowedUnitTypeCodes(
          projectType,
          projectStructure,
        );

        const resolvedId = resolveUnitTypeId(formatted, {
          hierarchyTypeCode,
          allowedCodes,
        });

        if (resolvedId) {
          const match = formatted.find((t) => t.id === resolvedId);
          setResolvedTypeLabel(
            match ? formatUnitTypeLabel(match.unit_name) : null,
          );
          setForm((prev) => ({
            ...prev,
            unit_type_id: unit?.unit_type_id || resolvedId,
          }));
        } else {
          setResolvedTypeLabel(null);
        }
      } catch (err) {
        console.error("Failed to load unit types:", err);
        setUnitTypes([]);
        setResolvedTypeLabel(null);
      } finally {
        setLoadingUnitTypes(false);
      }
    };

    void loadUnitTypes();
  }, [
    open,
    projectId,
    projectType,
    projectStructure,
    hierarchyTypeCode,
    unit?.unit_type_id,
  ]);

  useEffect(() => {
    if (open) {
      setForm(getInitialFormState(unit));
      setValidationError(null);
      setDuplicateUnitError(null);
    }
  }, [open, unit]);

  const toggleAmenity = (amenity: string) => {
    const current = form.amenities || [];
    setForm((prev) => ({
      ...prev,
      amenities: current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity],
    }));
  };

  const handleSave = () => {
    if (!form.unit_number || form.carpet_area_sqft <= 0) {
      setValidationError("Unit number and carpet area are required.");
      return;
    }
    if (checkDuplicateUnitNumber(form.unit_number, unit?.id)) {
      setDuplicateUnitError("This unit number already exists");
      return;
    }
    if (!form.unit_type_id) {
      setValidationError(
        "Unit types are not configured. Complete project setup (step 1: type & structure) first.",
      );
      return;
    }
    setValidationError(null);
    void onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>
            {unit ? "Edit Unit" : "New Unit"} - Ticket Style Setup
          </DialogTitle>
          <DialogDescription>
            {unit
              ? "Update unit details for this project."
              : "Add a new unit using the unit type from project setup."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-4">
          <div>
            <Label>Unit Number *</Label>
            <Input
              value={form.unit_number}
              onChange={(e) => handleUnitNumberChange(e.target.value)}
              onBlur={(e) => handleUnitNumberChange(e.target.value)}
              className={duplicateUnitError ? "border-destructive" : undefined}
            />
            {duplicateUnitError && (
              <p className="text-sm text-destructive mt-1">
                {duplicateUnitError}
              </p>
            )}
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                setForm({ ...form, status: v as UnitFormValues["status"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden col-span-2 rounded-md border bg-muted/40 px-3 py-2">
            <Label className="text-muted-foreground text-xs">
              Unit type (from project setup)
            </Label>
            {loadingUnitTypes ? (
              <p className="text-sm text-muted-foreground mt-1">Loading…</p>
            ) : resolvedTypeLabel ? (
              <p className="text-sm font-medium mt-1">{resolvedTypeLabel}</p>
            ) : (
              <p className="text-sm text-destructive mt-1">
                Not configured — save project type & structure in setup step 1.
              </p>
            )}
            {allowedTypeLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {allowedTypeLabels.map((label) => (
                  <Badge
                    key={label}
                    variant={
                      label === resolvedTypeLabel ? "default" : "outline"
                    }
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Carpet Area (sqft) *</Label>
            <Input
              type="number"
              value={form.carpet_area_sqft}
              onChange={(e) =>
                setForm({ ...form, carpet_area_sqft: Number(e.target.value) })
              }
            />
          </div>

          <div>
            <Label>Super Built-up (sqft)</Label>
            <Input
              type="number"
              value={form.super_builtup_area_sqft}
              onChange={(e) =>
                setForm({
                  ...form,
                  super_builtup_area_sqft: Number(e.target.value) || undefined,
                })
              }
            />
          </div>

          <div className="col-span-2">
            <Label>Facing</Label>
            <Input
              value={form.facing}
              onChange={(e) => setForm({ ...form, facing: e.target.value })}
              placeholder="North, Park View..."
            />
          </div>

          <div className="col-span-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {commonAmenities.map((am) => (
                <Badge
                  key={am}
                  variant={form.amenities?.includes(am) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleAmenity(am)}
                >
                  {am}
                </Badge>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <Label>Assigned Lead</Label>
            {loadingLeads ? (
              <p className="text-sm text-muted-foreground">Loading leads...</p>
            ) : leads.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No leads found for this project
              </p>
            ) : (
              <Select
                value={form.lead_id || "none"}
                onValueChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    lead_id: val === "none" ? null : val,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No lead assigned</SelectItem>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name}
                      {lead.phone && ` • ${lead.phone}`}
                      {lead.email && ` • ${lead.email}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Price (₹)</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        {validationError && (
          <p className="text-sm text-destructive">{validationError}</p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loadingUnitTypes || !!duplicateUnitError}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Unit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnitForm;

import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react";
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
import axiosInstance from "@/api/axiosInstance";
import { Plus, X } from "lucide-react";
import { AREA_FIELDS_MODE_OPTIONS } from "@/components/inventory/inventoryConstants";
import type { AreaFieldsMode } from "@/store/types/inventory";
import { normalizeAreaFieldsMode } from "@/utils/areaConversion";

export interface UnitTypeLabel {
  id: number;
  unit_name: string;
  label: string | null;
  is_active: boolean;
  area_fields_mode?: AreaFieldsMode | string | null;
}

export interface UnitTypesSectionHandle {
  validate: () => boolean;
  refresh: () => Promise<void>;
}

interface UnitTypesSectionProps {
  projectId: string | null;
  onChange?: (types: UnitTypeLabel[]) => void;
}

const SUGGESTED_LABELS = ["1 BHK", "2 BHK", "3 BHK", "Studio"];

const UnitTypesSection = forwardRef<UnitTypesSectionHandle, UnitTypesSectionProps>(
  ({ projectId, onChange }, ref) => {
    const [unitTypes, setUnitTypes] = useState<UnitTypeLabel[]>([]);
    const [newLabel, setNewLabel] = useState("");
    const [newAreaMode, setNewAreaMode] = useState<AreaFieldsMode>("carpet_only");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadUnitTypes = useCallback(async () => {
      if (!projectId) {
        setUnitTypes([]);
        onChange?.([]);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get(
          `/projects/${projectId}/unit-type-labels`,
        );
        const rows: UnitTypeLabel[] = res.data?.data ?? [];
        setUnitTypes(rows);
        onChange?.(rows);
      } catch (err: unknown) {
        console.error(err);
        const message =
          (err as { response?: { data?: { error?: string; details?: string } } })
            ?.response?.data?.error ??
          (err as { response?: { data?: { details?: string } } })?.response?.data
            ?.details ??
          "Failed to load unit types";
        setError(message);
        setUnitTypes([]);
        onChange?.([]);
      } finally {
        setLoading(false);
      }
    }, [projectId, onChange]);

    useEffect(() => {
      void loadUnitTypes();
    }, [loadUnitTypes]);

    useImperativeHandle(ref, () => ({
      validate: () => {
        if (!projectId) {
          setError("Save Step 1 first to add unit types.");
          return false;
        }
        if (unitTypes.length < 1) {
          setError("At least one unit type is required before proceeding.");
          return false;
        }
        setError("");
        return true;
      },
      refresh: loadUnitTypes,
    }));

    const handleAdd = async (labelInput?: string, areaMode?: AreaFieldsMode) => {
      const label = (labelInput ?? newLabel).trim();
      const mode = areaMode ?? newAreaMode;
      if (!label || !projectId) return;
      if (label.length > 50) {
        setError("Unit type label must be 50 characters or fewer.");
        return;
      }
      setSaving(true);
      setError("");
      try {
        await axiosInstance.post(`/projects/${projectId}/unit-type-labels`, {
          label,
          area_fields_mode: mode,
        });
        setNewLabel("");
        setNewAreaMode("carpet_only");
        await loadUnitTypes();
      } catch (err: unknown) {
        const data = (err as { response?: { data?: { error?: string; details?: string } } })
          ?.response?.data;
        const message =
          [data?.error, data?.details].filter(Boolean).join(" — ") ||
          "Failed to add unit type";
        setError(message);
      } finally {
        setSaving(false);
      }
    };

    const handleRemove = async (typeId: number) => {
      if (!projectId) return;
      setSaving(true);
      setError("");
      try {
        await axiosInstance.delete(
          `/projects/${projectId}/unit-type-labels/${typeId}`,
        );
        await loadUnitTypes();
      } catch (err) {
        console.error(err);
        setError("Failed to remove unit type");
      } finally {
        setSaving(false);
      }
    };

    const handleAreaFieldsModeChange = async (
      typeId: number,
      mode: AreaFieldsMode,
    ) => {
      if (!projectId) return;
      setSaving(true);
      setError("");
      try {
        const res = await axiosInstance.put(
          `/projects/${projectId}/unit-type-labels/${typeId}`,
          { area_fields_mode: mode },
        );
        const updated = res.data?.data;
        setUnitTypes((prev) => {
          const next = prev.map((row) =>
            row.id === typeId
              ? { ...row, area_fields_mode: updated?.area_fields_mode ?? mode }
              : row,
          );
          onChange?.(next);
          return next;
        });
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error ?? "Failed to update area type";
        setError(message);
      } finally {
        setSaving(false);
      }
    };

    const displayLabel = (row: UnitTypeLabel) =>
      row.label?.trim() || row.unit_name;

    const existingLabels = new Set(
      unitTypes.map((t) => displayLabel(t).toLowerCase()),
    );

    return (
      <div className="space-y-4">
        {!projectId && (
          <p className="text-sm text-amber-600 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            Complete Step 1 to create the project before adding unit types.
          </p>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Quick add
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_LABELS.filter(
              (s) => !existingLabels.has(s.toLowerCase()),
            ).map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="cursor-pointer border-dashed hover:bg-primary/5 hover:border-primary/40 transition-colors"
                onClick={() =>
                  projectId && !saving && handleAdd(suggestion, newAreaMode)
                }
              >
                + {suggestion}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Unit type label</Label>
            <Input
              placeholder="e.g. Office, Showroom, 4 BHK"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              disabled={!projectId || saving}
              maxLength={50}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Area type for this unit type</Label>
            <Select
              value={newAreaMode}
              onValueChange={(v) => setNewAreaMode(v as AreaFieldsMode)}
              disabled={!projectId || saving}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AREA_FIELDS_MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Units of this type will use Carpet Area or Super Builtup only.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => handleAdd()}
          disabled={!projectId || saving || !newLabel.trim()}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add unit type
        </Button>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading unit types...</p>
        ) : unitTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4 text-center">
            No unit types yet. Add at least one to continue.
          </p>
        ) : (
          <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground px-1">
              Configured unit types
            </p>
            {unitTypes.map((type) => (
              <div
                key={type.id}
                className="flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3 rounded-md border bg-background p-3"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Badge variant="secondary" className="shrink-0 text-sm py-1">
                    {displayLabel(type)}
                  </Badge>
                  <button
                    type="button"
                    className="rounded-full hover:bg-muted p-1 shrink-0"
                    onClick={() => handleRemove(type.id)}
                    disabled={saving}
                    aria-label={`Remove ${displayLabel(type)}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="sm:w-72">
                  <Label className="text-xs text-muted-foreground">
                    Area type
                  </Label>
                  <Select
                    value={normalizeAreaFieldsMode(type.area_fields_mode)}
                    onValueChange={(v) =>
                      void handleAreaFieldsModeChange(
                        type.id,
                        v as AreaFieldsMode,
                      )
                    }
                    disabled={!projectId || saving}
                  >
                    <SelectTrigger className="h-9 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AREA_FIELDS_MODE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);

UnitTypesSection.displayName = "UnitTypesSection";

export default UnitTypesSection;

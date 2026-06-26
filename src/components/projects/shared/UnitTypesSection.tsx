import { useCallback, useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import axiosInstance from "@/api/axiosInstance";
import { Plus, X } from "lucide-react";

export interface UnitTypeLabel {
  id: number;
  unit_name: string;
  label: string | null;
  is_active: boolean;
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
      try {
        const res = await axiosInstance.get(
          `/projects/${projectId}/unit-type-labels`,
        );
        const rows: UnitTypeLabel[] = res.data?.data ?? [];
        setUnitTypes(rows);
        onChange?.(rows);
      } catch (err) {
        console.error(err);
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

    const handleAdd = async (labelInput?: string) => {
      const label = (labelInput ?? newLabel).trim();
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
        });
        setNewLabel("");
        await loadUnitTypes();
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: string } } })?.response?.data
            ?.error ?? "Failed to add unit type";
        setError(message);
      } finally {
        setSaving(false);
      }
    };

    const handleRemove = async (typeId: number) => {
      if (!projectId) return;
      setSaving(true);
      try {
        await axiosInstance.delete(
          `/projects/${projectId}/unit-type-labels/${typeId}`,
        );
        await loadUnitTypes();
      } catch (err) {
        console.error(err);
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
                onClick={() => projectId && !saving && handleAdd(suggestion)}
              >
                + {suggestion}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Custom label — e.g. Office, Showroom, 4 BHK"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            disabled={!projectId || saving}
            maxLength={50}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={() => handleAdd()}
            disabled={!projectId || saving || !newLabel.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading unit types...</p>
        ) : unitTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-md border border-dashed p-4 text-center">
            No unit types yet. Add at least one to continue.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/20 p-3">
            {unitTypes.map((type) => (
              <Badge
                key={type.id}
                variant="secondary"
                className="gap-1 pr-1 text-sm py-1"
              >
                {displayLabel(type)}
                <button
                  type="button"
                  className="ml-1 rounded-full hover:bg-background/80 p-0.5"
                  onClick={() => handleRemove(type.id)}
                  disabled={saving}
                  aria-label={`Remove ${displayLabel(type)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
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

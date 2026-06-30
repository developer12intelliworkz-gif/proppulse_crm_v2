import { useCallback, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axiosInstance from "@/api/axiosInstance";
import { AREA_UNIT_OPTIONS } from "@/components/inventory/inventoryConstants";
import {
  normalizeAreaUnitCode,
  type AreaUnitCode,
} from "@/utils/areaConversion";

interface DefaultAreaUnitSectionProps {
  projectId: string | null;
}

const DefaultAreaUnitSection = ({ projectId }: DefaultAreaUnitSectionProps) => {
  const [value, setValue] = useState<AreaUnitCode>("sqft");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadDefault = useCallback(async () => {
    if (!projectId) {
      setValue("sqft");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.get(`/projects/${projectId}`);
      const row = res.data?.data ?? res.data;
      setValue(normalizeAreaUnitCode(row?.default_area_unit));
    } catch {
      setError("Could not load project area unit");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadDefault();
  }, [loadDefault]);

  const handleChange = async (next: string) => {
    const normalized = normalizeAreaUnitCode(next);
    setValue(normalized);
    if (!projectId) return;

    setSaving(true);
    setError("");
    try {
      await axiosInstance.put(`/projects/${projectId}`, {
        default_area_unit: normalized,
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to save area unit";
      setError(message);
      void loadDefault();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Default Area Unit</Label>
      <p className="text-xs text-muted-foreground">
        Used for all area inputs in this project. Values are stored internally
        in sq.ft and converted for display.
      </p>
      <Select
        value={value}
        onValueChange={handleChange}
        disabled={!projectId || loading || saving}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select area unit" />
        </SelectTrigger>
        <SelectContent>
          {AREA_UNIT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
};

export default DefaultAreaUnitSection;

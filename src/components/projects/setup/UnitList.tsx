// src/components/projects/setup/UnitList.tsx
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import axiosInstance from "@/api/axiosInstance";
import { useToast } from "@/components/ui/use-toast";
import UnitGrid from "./UnitGrid";
import UnitForm from "./UnitForm";
import { Unit, UnitFormValues } from "./unitTypes";

interface UnitListProps {
  projectId: string;
  nodeId: string;
  level3Label?: string;
  projectType?: string | null;
  projectStructure?: string | null;
  hierarchyTypeCode?: string | null;
}

const mapApiUnit = (row: Record<string, unknown>): Unit => ({
  id: String(row.id),
  nodeId: String(row.hierarchy_node_id ?? row.nodeId),
  unit_number: String(row.unit_number ?? ""),
  status: (row.status as Unit["status"]) || "available",
  carpet_area_sqft: Number(row.carpet_area_sqft) || 0,
  super_builtup_area_sqft:
    row.super_builtup_area_sqft !== null && row.super_builtup_area_sqft !== undefined
      ? Number(row.super_builtup_area_sqft)
      : undefined,
  facing: row.facing ? String(row.facing) : undefined,
  amenities: Array.isArray(row.amenities) ? (row.amenities as string[]) : [],
  price: row.price !== null && row.price !== undefined ? Number(row.price) : undefined,
  lead_id: row.lead_id ? String(row.lead_id) : null,
});

const UnitList = ({
  projectId,
  nodeId,
  level3Label = "node",
  projectType,
  projectStructure,
  hierarchyTypeCode,
}: UnitListProps) => {
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);

  const loadUnits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/projects/${projectId}/units`, {
        params: { hierarchy_node_id: nodeId },
      });
      const rows = res.data?.data ?? [];
      setUnits(Array.isArray(rows) ? rows.map(mapApiUnit) : []);
    } catch {
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, nodeId]);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const openForm = (unit?: Unit) => {
    setEditingUnit(unit || null);
    setShowForm(true);
  };

  const handleSave = async (form: UnitFormValues) => {
    setSaving(true);
    const payload = {
      hierarchy_node_id: nodeId,
      nodeId,
      unit_number: form.unit_number,
      unit_type_id: form.unit_type_id || null,
      status: form.status,
      carpet_area_sqft: form.carpet_area_sqft,
      super_builtup_area_sqft: form.super_builtup_area_sqft || null,
      facing: form.facing || null,
      amenities: form.amenities ?? [],
      price: form.price || null,
      lead_id: form.lead_id || null,
    };

    try {
      if (editingUnit?.id) {
        await axiosInstance.put(
          `/projects/${projectId}/units/${editingUnit.id}`,
          payload,
        );
      } else {
        await axiosInstance.post(`/projects/${projectId}/units`, payload);
      }
      await loadUnits();
      setEditingUnit(null);
      setShowForm(false);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; details?: string } } })
        ?.response?.data;
      const message = [data?.error, data?.details].filter(Boolean).join(" — ") ||
        "Could not save unit to the database.";
      // toast({
        // title: "Failed to save unit",
        // description: message,
        // variant: "destructive",
      // });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUnit) return;
    setSaving(true);
    try {
      await axiosInstance.delete(
        `/projects/${projectId}/units/${deletingUnit.id}`,
      );
      await loadUnits();
      setDeletingUnit(null);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Units — {level3Label}</h2>
          <p className="text-muted-foreground">
            Manage inventory units for this {level3Label.toLowerCase()}
          </p>
        </div>
        <Button onClick={() => openForm()} disabled={saving}>
          <Plus className="mr-2" /> Add New Unit
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <UnitGrid
          units={units}
          onUnitClick={(unit) => openForm(unit)}
          onAssignLead={() => {}}
          onDeleteUnit={(unit) => setDeletingUnit(unit)}
        />
      )}

      <UnitForm
        open={showForm}
        unit={editingUnit}
        projectId={projectId}
        projectType={projectType}
        projectStructure={projectStructure}
        hierarchyTypeCode={hierarchyTypeCode}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        saving={saving}
      />

      <Dialog
        open={!!deletingUnit}
        onOpenChange={(open) => !open && setDeletingUnit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Unit?</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete unit{" "}
            <strong>{deletingUnit?.unit_number}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2 pt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnitList;

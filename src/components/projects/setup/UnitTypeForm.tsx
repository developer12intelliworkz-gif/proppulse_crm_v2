// src/components/projects/setup/UnitTypeForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";

interface UnitType {
  id?: string;
  unit_name: string;
  carpet_area_sqft: number;
  super_builtup_area_sqft?: number;
}

interface UnitTypeFormProps {
  projectId: string;
  unitType?: UnitType | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCreated?: (unitTypeId: string) => void;
}

const UnitTypeForm = ({
  projectId,
  unitType,
  open,
  onClose,
  onSuccess,
  onCreated,
}: UnitTypeFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<UnitType>({
    unit_name: unitType?.unit_name || "",
    carpet_area_sqft: unitType?.carpet_area_sqft || 0,
    super_builtup_area_sqft: unitType?.super_builtup_area_sqft || 0,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: Number(value) || value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = unitType?.id
        ? `/projects/${projectId}/unit-types/${unitType.id}`
        : `/projects/${projectId}/unit-types`;
      const method = unitType?.id ? "put" : "post";
      const res = await axiosInstance({ method, url, data: formData });
      onSuccess();
      const createdId = res?.data?.data?.id;
      if (!unitType?.id && createdId !== undefined && createdId !== null) {
        onCreated?.(String(createdId));
      }
      onClose();
      // toast({
        // title: "Success",
        // description: unitType ? "Unit type updated" : "Unit type created",
      // });
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to save unit type",
        // variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {unitType ? "Edit Unit Type" : "Add New Unit Type"}
          </DialogTitle>
          <DialogDescription>
            {unitType
              ? "Update carpet and super built-up defaults for this unit type."
              : "Define a unit type with default area values for this project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="unit_name">Unit Name *</Label>
            <Input
              id="unit_name"
              name="unit_name"
              value={formData.unit_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="carpet_area_sqft">Carpet Area (sqft) *</Label>
            <Input
              id="carpet_area_sqft"
              name="carpet_area_sqft"
              type="number"
              min="0"
              value={formData.carpet_area_sqft}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="super_builtup_area_sqft">
              Super Built-up Area (sqft)
            </Label>
            <Input
              id="super_builtup_area_sqft"
              name="super_builtup_area_sqft"
              type="number"
              min="0"
              value={formData.super_builtup_area_sqft}
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : unitType ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UnitTypeForm;

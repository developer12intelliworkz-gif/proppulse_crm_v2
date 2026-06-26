// src/components/projects/setup/FloorForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";

interface Floor {
  id?: string;
  floor_number: string;
  floor_type?: string;
  total_units?: number;
  description?: string;
}

interface FloorFormProps {
  projectId: string;
  towerId: string;
  floor?: Floor | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FloorForm = ({
  projectId,
  towerId,
  floor,
  open,
  onClose,
  onSuccess,
}: FloorFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Floor>({
    floor_number: floor?.floor_number || "",
    floor_type: floor?.floor_type || "residential",
    total_units: floor?.total_units || 0,
    description: floor?.description || "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = floor?.id
        ? `/projects/${projectId}/towers/${towerId}/floors/${floor.id}`
        : `/projects/${projectId}/towers/${towerId}/floors`;
      const method = floor?.id ? "put" : "post";
      await axiosInstance({ method, url, data: formData });
      onSuccess();
      onClose();
      // toast({
        // title: "Success",
        // description: floor ? "Floor updated" : "Floor created",
      // });
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to save floor",
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
          <DialogTitle>{floor ? "Edit Floor" : "Add New Floor"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="floor_number">Floor Number *</Label>
            <Input
              id="floor_number"
              name="floor_number"
              value={formData.floor_number}
              onChange={handleChange}
              placeholder="e.g., 1, G, Basement"
              required
            />
          </div>
          <div>
            <Label htmlFor="floor_type">Floor Type</Label>
            <select
              name="floor_type"
              value={formData.floor_type}
              onChange={handleChange}
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="parking">Parking</option>
            </select>
          </div>
          <div>
            <Label htmlFor="total_units">Total Units</Label>
            <Input
              id="total_units"
              name="total_units"
              type="number"
              min="0"
              value={formData.total_units}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : floor ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FloorForm;

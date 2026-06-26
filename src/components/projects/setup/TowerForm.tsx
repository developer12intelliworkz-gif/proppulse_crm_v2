// src/components/projects/setup/TowerForm.tsx
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


interface Tower {
  id?: string;
  tower_name: string;
  total_floors: number;
  tower_type?: string;
  description?: string;
}

interface TowerFormProps {
  projectId: string;
  tower?: Tower | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TowerForm = ({
  projectId,
  tower,
  open,
  onClose,
  onSuccess,
}: TowerFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Tower>({
    tower_name: tower?.tower_name || "",
    total_floors: tower?.total_floors || 0,
    tower_type: tower?.tower_type || "residential",
    description: tower?.description || "",
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
      const url = tower?.id
        ? `/projects/${projectId}/towers/${tower.id}`
        : `/projects/${projectId}/towers`;
      const method = tower?.id ? "put" : "post";
      await axiosInstance({ method, url, data: formData });
      onSuccess();
      onClose();
      // toast({
        // title: "Success",
        // description: tower ? "Tower updated" : "Tower created",
      // });
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to save tower",
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
          <DialogTitle>{tower ? "Edit Tower" : "Add New Tower"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tower_name">Tower Name *</Label>
            <Input
              id="tower_name"
              name="tower_name"
              value={formData.tower_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="total_floors">Total Floors *</Label>
            <Input
              id="total_floors"
              name="total_floors"
              type="number"
              min="1"
              value={formData.total_floors}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="tower_type">Tower Type</Label>
            <select
              name="tower_type"
              value={formData.tower_type}
              onChange={handleChange}
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
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
              {loading ? "Saving..." : tower ? "Update" : "Create"}

            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TowerForm;

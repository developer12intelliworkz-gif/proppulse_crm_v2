// src/components/projects/setup/HierarchyNodeForm.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";

interface HierarchyNode {
  id?: string;
  parent_id?: string | null;
  name: string;
  type_code?: string;
  description?: string;
}

interface HierarchyNodeFormProps {
  projectId: string;
  node?: HierarchyNode | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const HierarchyNodeForm = ({
  projectId,
  node,
  open,
  onClose,
  onSuccess,
}: HierarchyNodeFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<HierarchyNode>({
    parent_id: node?.parent_id || null,
    name: node?.name || "",
    description: node?.description || "",
  });
  const [nodes, setNodes] = useState<HierarchyNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) fetchNodes();
  }, [open]);

  const fetchNodes = async () => {
    try {
      const res = await axiosInstance.get(
        `/projects/${projectId}/hierarchy-nodes`,
      );
      setNodes(res.data.data || []);
    } catch {
      // toast({
        // title: "Unable to load hierarchy",
        // description: "Hierarchy nodes could not be loaded. Please try again.",
        // variant: "destructive",
      // });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      // toast({
        // title: "Name required",
        // description: "Enter a name for this hierarchy node.",
        // variant: "destructive",
      // });
      return;
    }

    setLoading(true);
    try {
      const url = node?.id
        ? `/projects/${projectId}/hierarchy-nodes/${node.id}`
        : `/projects/${projectId}/hierarchy-nodes`;
      const method = node?.id ? "put" : "post";

      await axiosInstance({ method, url, data: formData });
      onSuccess();
      onClose();
      // toast({
        // title: node ? "Hierarchy node updated" : "Hierarchy node created",
        // description: node
          // ? "The hierarchy node has been saved successfully."
          // : "The new hierarchy node has been added successfully.",
      // });
    } catch (err) {
      // toast({
        // title: "Unable to save hierarchy node",
        // description: "Please check your connection and try again.",
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
            {node ? "Edit Node" : "Add New Hierarchy Node"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Parent Node (optional – Level 3 ke liye null)</Label>
            <Select
              value={formData.parent_id || "none"}
              onValueChange={(val) =>
                setFormData((prev) => ({
                  ...prev,
                  parent_id: val === "none" ? null : val,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent (if Level 4)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  No Parent (Level 3 – Tower/Sector etc.)
                </SelectItem>
                {nodes
                  .filter((n) => !n.parent_id) // Sirf Level 3 nodes parent ban sakte hain
                  .map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} ({n.type_code})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Tower A, Floor 5, Block B..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Optional details..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : node ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HierarchyNodeForm;

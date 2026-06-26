// src/components/projects/setup/FloorList.tsx
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash2, Edit3, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";
import FloorForm from "./FloorForm";

interface Floor {
  id: string;
  floor_number: string;
  floor_type?: string;
  total_units?: number;
  description?: string;
}

interface FloorListProps {
  projectId: string;
  towerId: string;
  floors: Floor[];
  setFloors: Dispatch<SetStateAction<Floor[]>>;
  onFloorSelect: (floorId: string) => void; // ← Removed ?
}

const FloorList = ({
  projectId,
  towerId,
  floors,
  setFloors,
  onFloorSelect,
}: FloorListProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFloors = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/projects/${projectId}/towers/${towerId}/floors`
      );
      setFloors(res.data.data || []);
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to fetch floors",
        // variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (floorId: string) => {
    try {
      await axiosInstance.delete(
        `/projects/${projectId}/towers/${towerId}/floors/${floorId}`
      );
      setFloors(floors.filter((f) => f.id !== floorId));
      // toast({ title: "Success", description: "Floor deleted" });
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to delete floor",
        // variant: "destructive",
      // });
    }
    setDeletingId(null);
  };

  const handleEdit = (floor: Floor) => {
    setEditingFloor(floor);
    setShowForm(true);
  };

  if (loading) return <p>Loading floors...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Floors</h2>
        <Button
          onClick={() => {
            setEditingFloor(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Floor
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {floors.map((floor) => (
          <Card key={floor.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>Floor {floor.floor_number}</span>
                <Badge>{floor.floor_type || "Residential"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>Units:</strong> {floor.total_units || 0}
              </p>
              <p className="text-sm text-gray-600">
                {floor.description || "No description"}
              </p>
              <div className="flex gap-2 pt-2">
                {onFloorSelect && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFloorSelect(floor.id)}
                  >
                    View Units
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(floor)}
                >
                  <Edit3 className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Dialog
                  open={deletingId === floor.id}
                  onOpenChange={() => setDeletingId(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => setDeletingId(floor.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Floor?</DialogTitle>
                    </DialogHeader>
                    <p>This will delete associated units.</p>
                    <div className="flex gap-2 pt-4">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(floor.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <FloorForm
        projectId={projectId}
        towerId={towerId}
        floor={editingFloor}
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingFloor(null);
        }}
        onSuccess={fetchFloors}
      />
    </div>
  );
};

export default FloorList;

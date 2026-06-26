// src/components/projects/setup/TowerList.tsx
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
import TowerForm from "./TowerForm";

interface Tower {
  id: string;
  tower_name: string;
  
  total_floors: number;
  description?: string;
  tower_type?: string;
}

interface TowerListProps {
  projectId: string;
  towers: Tower[];
  setTowers: Dispatch<SetStateAction<Tower[]>>;
  onTowerSelect: (towerId: string) => void; // ← Removed ?
}
const TowerList = ({
  projectId,
  towers,
  setTowers,
  onTowerSelect,
}: TowerListProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTower, setEditingTower] = useState<Tower | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTowers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/projects/${projectId}/towers`);
      setTowers(res.data.data || []);
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to fetch towers",
        // variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (towerId: string) => {
    try {
      await axiosInstance.delete(`/projects/${projectId}/towers/${towerId}`);
      setTowers(towers.filter((t) => t.id !== towerId));
      // toast({ title: "Success", description: "Tower deleted" });
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to delete tower",
        // variant: "destructive",
      // });
    }
    setDeletingId(null);
  };

  const handleEdit = (tower: Tower) => {
    setEditingTower(tower);
    setShowForm(true);
  };

  if (loading) return <p>Loading towers...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Towers</h2>
        <Button
          onClick={() => {
            setEditingTower(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Tower
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {towers.map((tower) => (
          <Card key={tower.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{tower.tower_name}</span>
                <Badge>{tower.tower_type || "Residential"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>Floors:</strong> {tower.total_floors}
              </p>
              <p className="text-sm text-gray-600">
                {tower.description || "No description"}
              </p>
              <div className="flex gap-2 pt-2">
                {onTowerSelect && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTowerSelect(tower.id)}
                  >
                    View Floors
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(tower)}
                >
                  <Edit3 className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Dialog
                  open={deletingId === tower.id}
                  onOpenChange={() => setDeletingId(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => setDeletingId(tower.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Tower?</DialogTitle>
                    </DialogHeader>
                    <p>
                      Are you sure? This will delete associated floors/units.
                    </p>
                    <div className="flex gap-2 pt-4">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(tower.id)}
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

      <TowerForm
        projectId={projectId}
        tower={editingTower}
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingTower(null);
        }}
        onSuccess={fetchTowers}
      />
    </div>
  );
};

export default TowerList;

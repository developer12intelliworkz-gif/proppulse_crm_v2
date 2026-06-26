// src/components/projects/setup/UnitTypeList.tsx
import { useState, useEffect } from "react";
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
import UnitTypeForm from "./UnitTypeForm";

interface UnitType {
  id: string;
  unit_name: string;
  carpet_area_sqft: number;
  super_builtup_area_sqft?: number;
}

interface UnitTypeListProps {
  projectId: string;
}

const UnitTypeList = ({ projectId }: UnitTypeListProps) => {
  const { toast } = useToast();
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<UnitType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUnitTypes();
  }, [projectId]);

  const fetchUnitTypes = async () => {
    try {
      const res = await axiosInstance.get(`/projects/${projectId}/unit-types`);
      setUnitTypes(res.data.data || []);
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to fetch unit types",
        // variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (typeId: string) => {
    try {
      await axiosInstance.delete(`/projects/${projectId}/unit-types/${typeId}`);
      setUnitTypes(unitTypes.filter((t) => t.id !== typeId));
      // toast({ title: "Success", description: "Unit type deleted" });
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to delete unit type",
        // variant: "destructive",
      // });
    }
    setDeletingId(null);
  };

  const handleEdit = (type: UnitType) => {
    setEditingType(type);
    setShowForm(true);
  };

  if (loading) return <p>Loading unit types...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Unit Types</h2>
        <Button
          onClick={() => {
            setEditingType(null);
            setShowForm(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Unit Type
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {unitTypes.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{type.unit_name}</span>
                <Badge variant="secondary">{type.carpet_area_sqft} sqft</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-gray-600">
                Super Built-up: {type.super_builtup_area_sqft || "N/A"} sqft
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(type)}
                >
                  <Edit3 className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Dialog
                  open={deletingId === type.id}
                  onOpenChange={() => setDeletingId(null)}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Unit Type?</DialogTitle>
                    </DialogHeader>
                    <p>This may affect existing units.</p>
                    <div className="flex gap-2 pt-4">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(type.id)}
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

      <UnitTypeForm
        projectId={projectId}
        unitType={editingType}
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingType(null);
        }}
        onSuccess={fetchUnitTypes}
      />
    </div>
  );
};

export default UnitTypeList;

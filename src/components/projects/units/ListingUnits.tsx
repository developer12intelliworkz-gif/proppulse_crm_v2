import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building,
  MapPin,
  Edit,
  Trash2,
  List,
  Grid,
  Calendar,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import CreateUnits from "./CreateUnits";

interface Unit {
  id: string;
  name: string;
  project: string;
  tower: string;
  floor: number;
  baseRate: number;
  unitConfig: string;
  propertyPurpose: string;
  type: string;
  category: string;
  bedrooms: number;
  bathrooms: number;
  carpetArea: number;
  saleableArea: number;
  loading: number;
  description: string;
  created: string;
  lead_id?: string | null;
}

const ListingUnits = () => {
  const { hasPermission, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();

  useEffect(() => {
    // Dummy data
    const dummyUnits: Unit[] = [
      {
        id: "1",
        name: "Unit 101",
        created: "2023-10-01",
        project: "Project A",
        tower: "Tower 1",
        floor: 1,
        baseRate: 5000,
        unitConfig: "Plan A",
        propertyPurpose: "Sale",
        type: "Apartment",
        category: "Luxury",
        bedrooms: 2,
        bathrooms: 2,
        carpetArea: 1200,
        saleableArea: 1300,
        loading: 10,
        description: "A spacious unit with modern amenities.",
      },
      {
        id: "2",
        name: "Unit 202",
        created: "2023-11-15",
        project: "Project B",
        tower: "Tower 2",
        floor: 2,
        baseRate: 6000,
        unitConfig: "Plan B",
        propertyPurpose: "Rent",
        type: "Penthouse",
        category: "Premium",
        bedrooms: 3,
        bathrooms: 3,
        carpetArea: 1500,
        saleableArea: 1600,
        loading: 15,
        description: "Luxurious penthouse with a great view.",
      },
    ];
    setUnits(dummyUnits);
    setLoading(false);
  }, []);

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDeleteUnit = () => {
    setIsDeleteDialogOpen(false);
    setSelectedUnit(null);
    // toast({ title: "Success", description: "Unit has been deleted." });
  };

  if (!hasPermission("view_projects")) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to view units.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading units...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <Button onClick={() => {}} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Units</h1>
            <p className="text-muted-foreground">Complete list of CRM units</p>
          </div>
          {hasPermission("create_projects") && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Unit</DialogTitle>
                </DialogHeader>
                <CreateUnits />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Input
              placeholder="Search units..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUnits.map((unit) => (
              <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{unit.name}</CardTitle>
                        <p className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1" />
                          {unit.project} - {unit.tower}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span>Floor:</span>
                    <span className="font-medium">{unit.floor}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Rate:</span>
                    <span className="font-medium">{unit.baseRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carpet Area:</span>
                    <span className="font-medium">
                      {unit.carpetArea} Sq. ft.
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 inline" />
                      Created:{" "}
                      {unit.created
                        ? new Date(unit.created).toLocaleDateString()
                        : "N/A"}
                    </div>
                    {currentUser?.role === "admin" && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => navigate(`/units/edit/${unit.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Dialog
                          open={
                            isDeleteDialogOpen && selectedUnit?.id === unit.id
                          }
                          onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) setSelectedUnit(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setSelectedUnit(unit);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Delete</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p>
                                Are you sure you want to delete the unit{" "}
                                <strong>{unit.name}</strong>?
                              </p>
                              <div className="flex justify-end gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsDeleteDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleDeleteUnit}
                                >
                                  Confirm Delete
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUnits.map((unit) => (
              <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{unit.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-1" />
                        {unit.project} - {unit.tower}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <div>Floor: {unit.floor}</div>
                      <div>Base Rate: {unit.baseRate}</div>
                    </div>
                    {currentUser?.role === "admin" && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/units/edit/${unit.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Dialog
                          open={
                            isDeleteDialogOpen && selectedUnit?.id === unit.id
                          }
                          onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) setSelectedUnit(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUnit(unit);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Delete</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p>
                                Are you sure you want to delete the unit{" "}
                                <strong>{unit.name}</strong>?
                              </p>
                              <div className="flex justify-end gap-3">
                                <Button
                                  variant="outline"
                                  onClick={() => setIsDeleteDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleDeleteUnit}
                                >
                                  Confirm Delete
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingUnits;

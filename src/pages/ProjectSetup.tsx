// src/pages/ProjectSetup.tsx (or components/projects/ProjectSetup.tsx)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Layers, Home } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";

// Types (tere backend se match kar)
interface Project {
  id: string;
  name: string;
}
interface Tower {
  id: string;
  tower_name: string;
  total_floors: number;
}
interface Floor {
  id: string;
  floor_number: string;
  tower_id: string;
}
interface Unit {
  id: string;
  unit_number: string;
  floor_id: string;
  status: string;
}

const ProjectSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedTower, setSelectedTower] = useState<string>("");
  const [selectedFloor, setSelectedFloor] = useState<string>("");

  // Lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"projects" | "towers" | "floors" | "units">(
    "projects"
  );

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/projects");
      setProjects(res.data.data || []);
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to fetch projects",
        // variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  const fetchTowers = async (projectId: string) => {
    try {
      const res = await axiosInstance.get(`/projects/${projectId}/towers`);
      setTowers(res.data.data || []);
      setView("towers");
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to fetch towers",
        // variant: "destructive",
      // });
    }
  };

  const fetchFloors = async (towerId: string) => {
    try {
      const res = await axiosInstance.get(
        `/projects/${selectedProject}/towers/${towerId}/floors`
      );
      setFloors(res.data.data || []);
      setView("floors");
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to fetch floors",
        // variant: "destructive",
      // });
    }
  };

  const fetchUnits = async (floorId: string) => {
    try {
      const res = await axiosInstance.get(
        `/projects/${selectedProject}/towers/${selectedTower}/floors/${floorId}/units`
      );
      setUnits(res.data.data || []);
      setView("units");
    } catch (err) {
      // toast({
        // title: "Error",
        // description: "Failed to fetch units",
        // variant: "destructive",
      // });
    }
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setSelectedTower("");
    setSelectedFloor("");
    setTowers([]);
    setFloors([]);
    setUnits([]);
    fetchTowers(projectId);
  };

  const handleTowerSelect = (towerId: string) => {
    setSelectedTower(towerId);
    setSelectedFloor("");
    setFloors([]);
    setUnits([]);
    fetchFloors(towerId);
  };

  const handleFloorSelect = (floorId: string) => {
    setSelectedFloor(floorId);
    setUnits([]);
    fetchUnits(floorId);
  };

  const goBack = () => {
    if (view === "towers") {
      setView("projects");
      setSelectedTower("");
      setSelectedFloor("");
    } else if (view === "floors") {
      setView("towers");
      setSelectedFloor("");
    } else if (view === "units") {
      setView("floors");
    }
  };

  // Render List View based on current view
  const renderList = () => {
    switch (view) {
      case "projects":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <Card key={proj.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {proj.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleProjectSelect(proj.id)}
                    className="w-full"
                  >
                    Setup Towers <Plus className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case "towers":
        return (
          <div className="space-y-4">
            <Select value={selectedTower} onValueChange={handleTowerSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select Tower" />
              </SelectTrigger>
              <SelectContent>
                {towers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.tower_name} ({t.total_floors} floors)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {towers.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{t.tower_name}</h3>
                    <p className="text-sm text-gray-600">
                      {t.total_floors} floors
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTowerSelect(t.id)}
                    >
                      Setup Floors
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case "floors":
        return (
          <div className="space-y-4">
            <Select value={selectedFloor} onValueChange={handleFloorSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select Floor" />
              </SelectTrigger>
              <SelectContent>
                {floors.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.floor_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {floors.map((f) => (
                <Card key={f.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">Floor {f.floor_number}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFloorSelect(f.id)}
                    >
                      Add Units
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      case "units":
        return (
          <div className="space-y-4">
            {/* Tere ListingUnits yahan integrate kar, or simple list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {units.map((u) => (
                <Card key={u.id}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{u.unit_number}</h3>
                    <Badge>{u.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* CreateUnits button/modal yahan add kar (neeche dekho) */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Project Setup</h1>
          <p className="text-muted-foreground">
            Manage Towers → Floors → Units
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          <Home className="w-4 h-4 mr-2" /> Back to Projects
        </Button>
      </div>

      {loading && <p>Loading...</p>}

      <Button variant="outline" onClick={goBack} className="mb-4">
        ← Back
      </Button>

      {renderList()}

      {/* Add buttons per level - e.g., Add Tower modal */}
      {view === "towers" && (
        <Button
          onClick={() => {
            /* Open modal for createTower */
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Tower
        </Button>
      )}
      {/* Similar for floors/units */}
    </div>
  );
};

export default ProjectSetup;

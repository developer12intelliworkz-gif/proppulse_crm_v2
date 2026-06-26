import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Plus, Building, MapPin, Calendar, Edit, Trash2 } from "lucide-react";
import ProjectDetailsModal from "./ProjectDetailsModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from "@/api/axiosInstance";

interface Project {
  id: string;
  name: string;
  description: string;
  rera_project_id: string;
  sales: string;
  possession: string;
  city: string;
  state: string;
  total_properties?: number;
  sold_properties?: number;
  is_active: boolean;
  search_address: string; // Added missing property
  address: string; // Added missing property
  street: string; // Added missing property
  country: string; // Added missing property
  zipcode?: string; // Assumed additional property
  latitude?: number; // Assumed additional property
  longitude?: number; // Assumed additional property
  project_type?: string; // Assumed additional property
}

const ProjectManagement = () => {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axiosInstance.get("/projects");
      const data = response.data;
      // Map API response to ensure all required properties are included
      const updatedProjects = (data.data || []).map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        rera_project_id: project.rera_project_id,
        sales: project.sales,
        possession: project.possession,
        city: project.city,
        state: project.state,
        total_properties: project.total_properties || 0,
        sold_properties: project.sold_properties || 0,
        is_active: project.is_active,
        search_address: project.search_address || "", // Ensure API provides this
        address: project.address || "", // Ensure API provides this
        street: project.street || "", // Ensure API provides this
        country: project.country || "", // Ensure API provides this
        zipcode: project.zipcode || "", // Adjust based on actual API response
        latitude: project.latitude || 0, // Adjust based on actual API response
        longitude: project.longitude || 0, // Adjust based on actual API response
        project_type: project.project_type || "", // Adjust based on actual API response
      }));
      setProjects(updatedProjects);
    } catch (err: any) {
      console.error("Error:", err);
      // toast({
        // title: "Error",
        // description: err?.response?.data?.error || "Failed to fetch projects.",
        // variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      await axiosInstance.delete(`/projects/${project.id}`);
      setProjects(projects.filter((p) => p.id !== project.id));
      setIsDeleteDialogOpen(false);
      setProjectToDelete(null);
      // toast({
        // title: "Success",
        // description: `Project "${project.name}" has been deleted.`,
      // });
    } catch (err: any) {
      // toast({
        // title: "Error",
        // description:
          // err?.response?.data?.error ||
          // err.message ||
          // "Failed to delete project",
        // variant: "destructive",
      // });
    }
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: boolean) =>
    status ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";

  if (!hasPermission("manage_project")) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to manage projects.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Project Management
          </h2>
          <p className="text-muted-foreground">
            Manage your CRM projects and their details
          </p>
        </div>
        {hasPermission("create_projects") && (
          <Button onClick={() => navigate("/projects/create")}>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        )}
      </div>

      <Input
        placeholder="Search projects..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.slice(0, 5).map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle
                    className="text-lg cursor-pointer hover:text-blue-600"
                    onClick={() => {
                      setSelectedProject(project);
                      setIsDetailsDialogOpen(true);
                    }}
                  >
                    {project.name}
                  </CardTitle>
                  <CardDescription className="flex items-center max-w-[200px] truncate">
                    <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {project.city}, {project.state}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <Badge className={getStatusColor(project.is_active)}>
                  {project.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  RERA: {project.rera_project_id || "N/A"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Total Properties:</span>
                <span className="font-medium">
                  {project.total_properties || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sold:</span>
                <span className="font-medium text-green-600">
                  {project.sold_properties || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Completion Rate:</span>
                <span className="font-medium">
                  {project.total_properties
                    ? Math.round(
                        (project.sold_properties / project.total_properties) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <Calendar className="w-3 h-3 mr-1 inline" />
                  Possession:{" "}
                  {project.possession
                    ? new Date(project.possession).toLocaleDateString()
                    : "N/A"}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      navigate(`/projects/edit/${project.id}/step1`)
                    }
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Dialog
                    open={
                      isDeleteDialogOpen && projectToDelete?.id === project.id
                    }
                    onOpenChange={(open) => {
                      setIsDeleteDialogOpen(open);
                      if (!open) {
                        setProjectToDelete(null);
                      } else {
                        setProjectToDelete(project);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md w-full">
                      <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p>
                          Are you sure you want to delete the project{" "}
                          <strong>{projectToDelete?.name}</strong>?
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              if (projectToDelete) {
                                handleDeleteProject(projectToDelete);
                              }
                            }}
                          >
                            Confirm Delete
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredProjects.length > 5 && (
          <Card
            className="hover:shadow-lg transition-shadow cursor-pointer border-dashed border-2 border-primary/30 bg-primary/5"
            onClick={() => navigate("/projects/list")}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-primary mb-2">
                View All Projects
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {filteredProjects.length - 5} more projects
              </p>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          isOpen={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default ProjectManagement;

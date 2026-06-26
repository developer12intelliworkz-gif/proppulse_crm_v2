import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Building, Calendar } from "lucide-react";
import parse from "html-react-parser";
import he from "he";
import ProjectTasksPanel from "@/components/tasks/ProjectTasksPanel";

interface Project {
  id: string;
  name: string;
  description: string;
  rera_project_id: string;
  sales: string;
  possession: string;
  search_address: string;
  address: string;
  street: string;
  country: string;
  state: string;
  city: string;
  zip: string;
  locality: string;
  latitude: string;
  longitude: string;
  total_properties?: number;
  sold_properties?: number;
  is_active: boolean;
}

interface ProjectDetailsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

const ProjectDetailsModal = ({
  project,
  isOpen,
  onClose,
}: ProjectDetailsModalProps) => {
  const completionPercentage = project.total_properties
    ? Math.round((project.sold_properties / project.total_properties) * 100)
    : 0;

  const parseDescription = (description?: string) => {
    const safeDescription = description ? he.decode(description) : "";
    return parse(safeDescription, {
      trim: true,
      replace: (domNode) => {
        if (domNode.type === "tag") {
          if (domNode.name === "script") {
            return <span>{/* Neutralize script content */}</span>;
          }
          if (domNode.attribs) {
            const dangerousAttrs = Object.keys(domNode.attribs).filter((attr) =>
              attr.startsWith("on"),
            );
            if (dangerousAttrs.length > 0) {
              const { ...safeAttribs } = domNode.attribs;
              dangerousAttrs.forEach((attr) => delete safeAttribs[attr]);
              domNode.attribs = safeAttribs;
            }
          }
        }
        return domNode;
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {project.name}
            </DialogTitle>
            <Badge
              className={`${
                project.is_active
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {project.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="flex items-center font-medium text-gray-900">
                      <MapPin className="w-4 h-4 mr-2" />
                      {project.city}, {project.state}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">RERA ID</p>
                    <p className="font-medium text-gray-900">
                      {project.rera_project_id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Possession Date</p>
                    <p className="flex items-center font-medium text-gray-900">
                      <Calendar className="w-4 h-4 mr-2" />
                      {project.possession
                        ? new Date(project.possession).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Users</p>
                    <p className="font-medium text-gray-900">
                      {project.sales || "None"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <div className="font-medium text-gray-900 prose max-w-none">
                    {parseDescription(project.description) ||
                      "No description available"}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Full Address</p>
                  <p className="font-medium text-gray-900">
                    {project.address || "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Property Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {project.total_properties || 0}
                    </p>
                    <p className="text-sm text-gray-600">Total Properties</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {(project.total_properties || 0) -
                        (project.sold_properties || 0)}
                    </p>
                    <p className="text-sm text-gray-600">Available</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {project.sold_properties || 0}
                    </p>
                    <p className="text-sm text-gray-600">Sold</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <ProjectTasksPanel projectId={project.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsModal;

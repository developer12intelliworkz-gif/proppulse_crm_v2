import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Building2, Home, ChevronLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/api/axiosInstance";
import { useAppDispatch } from "@/store/hooks";
import {
  applyInventoryDraft,
  hydrateInventoryWizard,
  resetInventory,
  setProjectId,
  setProjectName,
} from "@/store/slices/inventorySlice";
import { mapBackendToInventory } from "@/components/inventory/inventoryBackendMapping";
import { PROJECT_TYPES } from "@/components/inventory/inventoryConstants";
import type { ProjectTypeKey } from "@/store/types/inventory";
import {
  hasPersistedInventory,
  loadInventoryDraft,
  loadInventoryFromDatabase,
} from "@/components/inventory/inventoryPersist";
import {
  isInitialSetupComplete,
  getProjectTypeLabel,
  getProjectStructureLabel,
  fetchProjectSetupStatus,
  resetProjectInitialSetup,
  logProjectSetupDiagnostics,
  ProjectSetupFields,
  ProjectSetupRoute,
  ProjectSetupView,
} from "./projectSetupHelpers";
import InventorySetupWizard from "./InventorySetupWizard";

type Project = ProjectSetupFields;

const ProjectSetup = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [view, setView] = useState<ProjectSetupView>("projects");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [setupRoute, setSetupRoute] = useState<ProjectSetupRoute | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [openingProjectId, setOpeningProjectId] = useState<string | null>(null);
  const [resettingSetup, setResettingSetup] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const mergeProjectInList = useCallback((updated: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
    );
  }, []);

  const resolveSetupMapping = (route: ProjectSetupRoute | null) => {
    if (!route?.initialSetupComplete || !route.projectType || !route.projectStructure) {
      return null;
    }
    if (route.inventorySubcategory) {
      for (const [typeKey, typeDef] of Object.entries(PROJECT_TYPES)) {
        if (typeDef.subcategories.some((s) => s.key === route.inventorySubcategory)) {
          return {
            projectType: typeKey as ProjectTypeKey,
            subcategory: route.inventorySubcategory,
          };
        }
      }
    }
    return mapBackendToInventory(route.projectType, route.projectStructure);
  };

  const syncInventoryForProject = async (
    projectId: string,
    projectName: string,
    route: ProjectSetupRoute | null,
  ) => {
    dispatch(resetInventory());
    dispatch(setProjectId(projectId));
    dispatch(setProjectName(projectName));

    const mapped = resolveSetupMapping(route);
    if (mapped) {
      dispatch(
        hydrateInventoryWizard({
          projectType: mapped.projectType,
          subcategory: mapped.subcategory,
          wizardStep: 3,
        }),
      );
    }

    const subcategory = mapped?.subcategory ?? null;
    const fromDb = await loadInventoryFromDatabase(projectId, subcategory);

    if (hasPersistedInventory(fromDb) && fromDb) {
      dispatch(applyInventoryDraft(fromDb));
    } else {
      const draft = loadInventoryDraft(projectId);
      if (draft) {
        dispatch(applyInventoryDraft(draft));
      }
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/projects");
      const data = res.data.data || res.data || [];
      // Use API/DB values only — do not merge localStorage (caused false "setup complete")
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      const saved = localStorage.getItem("projects");
      if (saved) {
        setProjects(JSON.parse(saved));
      }

      if (error.response?.status !== 403) {
        console.error("Unable to load projects");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createNewProject = async () => {
    if (!newProjectName.trim()) {
      return;
    }

    try {
      const res = await axiosInstance.post("/projects", {
        name: newProjectName.trim(),
      });
      const newProject = res.data.data || res.data;
      setProjects((prev) => [...prev, newProject]);
    } catch {
      const newProject: Project = {
        id: `proj_${Date.now()}`,
        name: newProjectName.trim(),
      };
      const updated = [...projects, newProject];
      setProjects(updated);
      localStorage.setItem("projects", JSON.stringify(updated));
    }

    setNewProjectName("");
    setShowNewProjectInput(false);
  };

  const selectProject = async (id: string) => {
    const projectMeta = projects.find((p) => p.id === id);
    const projectName = projectMeta?.name ?? "Project";
    setSelectedProjectId(id);
    setOpeningProjectId(id);

    try {
      const { route, diagnostics } = await fetchProjectSetupStatus(
        id,
        projectMeta?.name,
      );
      logProjectSetupDiagnostics(
        route.projectName,
        route.projectId,
        route,
        diagnostics,
      );
      setSetupRoute(route);
      mergeProjectInList({
        id: route.projectId,
        name: route.projectName,
        project_type: route.initialSetupComplete
          ? (route.projectType ?? undefined)
          : undefined,
        project_structure: route.initialSetupComplete
          ? (route.projectStructure ?? undefined)
          : undefined,
      });
      await syncInventoryForProject(id, route.projectName, route);
      setView("inventory_setup");
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { error?: string } };
      };
      setSetupRoute(null);
      await syncInventoryForProject(id, projectName, null);
      setView("inventory_setup");
      console.error(
        "Could not verify setup status",
        error.response?.data?.error ?? error.response?.status,
      );
    } finally {
      setOpeningProjectId(null);
    }
  };

  const handleResetSetup = async () => {
    if (!selectedProjectId) return;
    setResettingSetup(true);
    try {
      const { setupStatus, message } =
        await resetProjectInitialSetup(selectedProjectId);

      if (setupStatus) {
        setSetupRoute(setupStatus);
      }

      await syncInventoryForProject(
        selectedProjectId,
        currentProject?.name ?? "Project",
        setupStatus ?? setupRoute,
      );

      setShowResetConfirm(false);
      toast.success(
        message ?? "Layout setup reset. All inventory data was permanently deleted.",
      );
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(
        error.response?.data?.error ?? "Could not reset layout setup.",
      );
    } finally {
      setResettingSetup(false);
    }
  };

  const goBack = () => {
    if (view === "units") {
      setView("level3_hierarchy");
      return;
    }
    if (
      view === "inventory_setup" ||
      view === "level3_hierarchy" ||
      view === "initial_setup"
    ) {
      dispatch(resetInventory());
      setView("projects");
      setSetupRoute(null);
      setSelectedProjectId("");
    }
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="container mx-auto py-4 px-4">

      {view === "projects" && (
        <div>
          {/* <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Your Projects</h2>
            <Button
              onClick={() => setShowNewProjectInput(!showNewProjectInput)}
            >
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div> */}

          {showNewProjectInput && (
            <div className="max-w-md mb-8 p-4 border rounded-lg bg-card">
              <Label htmlFor="newProject">New Project Name</Label>
              <div className="flex gap-3 mt-2">
                <Input
                  id="newProject"
                  placeholder="e.g. Sunshine Heights Phase 2"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createNewProject()}
                />
                <Button onClick={createNewProject}>Create</Button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-center py-12 text-muted-foreground">
              Loading projects...
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.length === 0 && (
                <p className="col-span-full text-center py-12 text-muted-foreground">
                  No projects found. Create one above.
                </p>
              )}

              {projects.map((p) => {
                const configured = isInitialSetupComplete(p);
                const isOpening = openingProjectId === p.id;

                return (
                  <Card
                    key={p.id}
                    className={`cursor-pointer hover:border-primary hover:shadow-lg transition-all ${
                      isOpening ? "opacity-70 pointer-events-none" : ""
                    }`}
                    onClick={() => !isOpening && selectProject(p.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <Building2 className="mx-auto h-14 w-14 text-primary mb-4" />
                      <h3 className="text-2xl font-bold">{p.name}</h3>
                      {configured && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {getProjectTypeLabel(p.project_type!)} •{" "}
                          {getProjectStructureLabel(
                            p.project_type!,
                            p.project_structure!,
                          )}
                        </p>
                      )}
                      {!configured && (
                        <p className="text-sm text-amber-600 mt-2">
                          Set project type in project profile first
                        </p>
                      )}
                      <Button className="mt-6 w-full" disabled={isOpening}>
                        {isOpening ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          "Open Layout Builder"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === "inventory_setup" && currentProject && (
        <div className="space-y-4">
          <InventorySetupWizard
            projectId={selectedProjectId}
            projectName={currentProject.name}
            onReset={() => setShowResetConfirm(true)}
            resetting={resettingSetup}
          />
        </div>
      )}

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all layout data for{" "}
              <strong>{currentProject?.name ?? "this project"}</strong>, including
              all units, towers, floors, hierarchy nodes, and unit types. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resettingSetup}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleResetSetup();
              }}
              disabled={resettingSetup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resettingSetup ? "Deleting..." : "Yes, reset everything"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectSetup;

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { cn } from "@/lib/utils";
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
  isSetupPending,
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
  const [searchParams] = useSearchParams();
  const queryProjectId = searchParams.get("projectId");

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
  const [filterMode, setFilterMode] = useState<"pending" | "all">("pending");
  const [selectedProjectName, setSelectedProjectName] = useState<string>("");
  const hasAutoOpenedRef = useRef(false);

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
      const loaded = Array.isArray(data) ? data : [];
      setProjects(loaded);
      // NOTE: selectProject is triggered by the queryProjectId useEffect below, not here.
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      const saved = localStorage.getItem("projects");
      let loaded: Project[] = [];
      if (saved) {
        loaded = JSON.parse(saved);
        setProjects(loaded);
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

  useEffect(() => {
    // When navigating via ?projectId=, open the layout builder immediately.
    // We don't need the project in the loaded list — fetchProjectSetupStatus
    // will fetch it from the API directly.
    if (!queryProjectId || loading || hasAutoOpenedRef.current) return;
    hasAutoOpenedRef.current = true;
    selectProject(queryProjectId);
  }, [queryProjectId, loading]);

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
      setSelectedProjectName(route.projectName);
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
      setSelectedProjectName(projectName);
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
      navigate("/project-setup", { replace: true });
    }
  };

  const currentProjectName =
    projects.find((p) => p.id === selectedProjectId)?.name ??
    selectedProjectName;
  const currentProject = projects.find((p) => p.id === selectedProjectId) ??
    (selectedProjectId && selectedProjectName
      ? { id: selectedProjectId, name: selectedProjectName }
      : undefined);

  return (
    <div className="container mx-auto py-4 px-4">
      {/* Full-page spinner while opening a project via URL param */}
      {queryProjectId && view === "projects" && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--theme-color)]" />
          <p className="text-sm text-muted-foreground font-medium">Opening layout builder…</p>
        </div>
      )}

      {!queryProjectId && view === "projects" && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Project Setup</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure floor plans, layouts, and inventory lists for your projects.
              </p>
            </div>
            <div className="bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg inline-flex items-center border border-slate-200/40 dark:border-slate-800/50">
              <button
                type="button"
                onClick={() => setFilterMode("pending")}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all",
                  filterMode === "pending"
                    ? "bg-white dark:bg-slate-900 text-[var(--theme-color)] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Pending Setup
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all",
                  filterMode === "all"
                    ? "bg-white dark:bg-slate-900 text-[var(--theme-color)] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All Projects
              </button>
            </div>
          </div>

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
              {projects.length === 0 ? (
                <p className="col-span-full text-center py-12 text-muted-foreground">
                  No projects found. Create one in Projects module.
                </p>
              ) : (() => {
                const displayedProjects = projects.filter((p) => {
                  if (filterMode === "pending") {
                    return isSetupPending(p);
                  }
                  return true;
                });
                if (displayedProjects.length === 0) {
                  return (
                    <p className="col-span-full text-center py-12 text-muted-foreground font-medium">
                      {filterMode === "pending"
                        ? "All projects have been set up. Switch to 'All Projects' or check the Projects list."
                        : "No projects found."}
                    </p>
                  );
                }
                return displayedProjects.map((p) => {
                  const typeStructureSet = isInitialSetupComplete(p);
                  const hasUnits = (p.unit_count ?? 0) > 0;
                  const fullyComplete = typeStructureSet && hasUnits;
                  const isOpening = openingProjectId === p.id;

                  return (
                    <Card
                      key={p.id}
                      className={cn(
                        "cursor-pointer hover:border-[var(--theme-color)] hover:shadow-md transition-all border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl",
                        isOpening && "opacity-70 pointer-events-none"
                      )}
                      onClick={() => !isOpening && selectProject(p.id)}
                    >
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-slate-800 flex-shrink-0">
                          {isOpening ? (
                            <Loader2 className="h-5 w-5 animate-spin text-[var(--theme-color)]" />
                          ) : (
                            <Building2 className="h-6 w-6 text-[var(--theme-color)]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 truncate">
                            {p.name}
                          </h3>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            {typeStructureSet ? (
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {getProjectTypeLabel(p.project_type!)} • {getProjectStructureLabel(p.project_type!, p.project_structure!)}
                              </p>
                            ) : (
                              <p className="text-xs text-amber-600 font-medium truncate">
                                Type &amp; structure not configured
                              </p>
                            )}
                            {fullyComplete ? (
                              <span className="text-[9px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0">
                                Complete
                              </span>
                            ) : typeStructureSet ? (
                              <span className="text-[9px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0">
                                No units
                              </span>
                            ) : (
                              <span className="text-[9px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shrink-0">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}

      {view === "inventory_setup" && selectedProjectId && (
        <div className="space-y-4">
          <InventorySetupWizard
            projectId={selectedProjectId}
            projectName={currentProjectName || currentProject?.name || "Project"}
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

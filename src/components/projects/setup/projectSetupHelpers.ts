import axiosInstance from "@/api/axiosInstance";
import {
  PROJECT_HIERARCHY_CONFIG,
  ProjectType,
  getHierarchyConfig,
  getStructuresForType,
} from "./projectHierarchyConfig";

export interface ProjectSetupFields {
  id: string;
  name: string;
  project_type?: ProjectType | string;
  project_structure?: string;
  unit_count?: number;
  project_logo_url?: string | null;
}

export type ProjectSetupStep =
  | "initial_setup"
  | "level3_hierarchy"
  | "units";

export type ProjectSetupView =
  | "projects"
  | "inventory_setup"
  | "initial_setup"
  | "level3_hierarchy"
  | "units";

export interface ProjectSetupRoute {
  projectId: string;
  projectName: string;
  projectType: string | null;
  projectStructure: string | null;
  inventorySubcategory?: string | null;
  initialSetupComplete: boolean;
  hasPartialSetup?: boolean;
  nextStep: ProjectSetupStep;
  nextStepKey: string;
  nextStepTitle: string;
  nextStepDescription: string;
  level3Label: string | null;
  level3TypeCode: string | null;
  projectTypeName?: string | null;
  projectStructureName?: string | null;
  level3NodeCount?: number;
  unitCount?: number;
  hasInventory?: boolean;
  stepsCompleted: {
    initialSetup: boolean;
    level3Hierarchy: boolean;
    units: boolean;
  };
  hasLevel4?: boolean;
  configError?: string;
}

export interface ProjectSetupDiagnostics {
  project_type_column_exists?: boolean;
  project_structure_column_exists?: boolean;
  migration_required?: boolean;
  setupState?: "complete" | "partial" | "not_started";
  rawFromDatabase?: {
    project_type: string | null;
    project_structure: string | null;
  };
  whySkippedInitialSetup?: string;
}

/** Dev-only diagnostics — console only, not shown in production UI */
export const logProjectSetupDiagnostics = (
  projectName: string,
  projectId: string,
  route: ProjectSetupRoute,
  diagnostics?: ProjectSetupDiagnostics,
) => {
  const l1 = diagnostics?.rawFromDatabase?.project_type ?? "Not set";
  const l2 = diagnostics?.rawFromDatabase?.project_structure ?? "Not set";
  const message =
    diagnostics?.whySkippedInitialSetup ??
    (route.initialSetupComplete
      ? "Level 1 and Level 2 are saved — hierarchy setup applies."
      : "Level 1 and Level 2 are empty — start by selecting project type.");

  console.groupCollapsed(`[Project Setup] ${projectName} (${projectId})`);
  console.info(`Level 1 (project_type): ${l1}`);
  console.info(`Level 2 (project_structure): ${l2}`);
  console.info(message);
  if (diagnostics) {
    console.debug("Setup diagnostics", {
      setupState: diagnostics.setupState,
      nextStep: route.nextStep,
      nextStepTitle: route.nextStepTitle,
      initialSetupComplete: route.initialSetupComplete,
      hasPartialSetup: route.hasPartialSetup,
      migration_required: diagnostics.migration_required,
    });
  }
  console.groupEnd();

  if (diagnostics?.migration_required) {
    console.error(
      "[Project Setup] Database migration required: run migration/2026-05-23-fix-project-setup-defaults.sql",
    );
  }
};

const validTypeCodes = () =>
  PROJECT_HIERARCHY_CONFIG.level1_project_types.map((t) => t.code);

/** Only true when both L1+L2 are valid per PROJECT_CONFIG (database-verified values) */
export const isInitialSetupComplete = (project: {
  project_type?: string | null;
  project_structure?: string | null;
}) => {
  const type = project.project_type?.trim().toUpperCase();
  const structure = project.project_structure?.trim().toUpperCase();
  if (!type || !structure) return false;
  if (!validTypeCodes().includes(type)) return false;
  return getHierarchyConfig(type as ProjectType, structure) !== null;
};

/**
 * A project is "pending setup" if either:
 *  - project_type / project_structure are not yet set, OR
 *  - no units have been created yet (unit_count === 0)
 * Used by the Project Setup dashboard to decide the "Pending" filter.
 */
export const isSetupPending = (project: {
  project_type?: string | null;
  project_structure?: string | null;
  unit_count?: number | null;
}) => {
  if (!isInitialSetupComplete(project)) return true;
  return (project.unit_count ?? 0) === 0;
};

export const getProjectTypeLabel = (code: string) =>
  PROJECT_HIERARCHY_CONFIG.level1_project_types.find((t) => t.code === code)
    ?.name ?? code;

export const getProjectStructureLabel = (
  type: ProjectType | string,
  code: string,
) =>
  getStructuresForType(type as ProjectType).find((s) => s.code === code)?.name ??
  code.replace(/_/g, " ");

export const getNextStepAfterProjectSetup = (
  project: ProjectSetupFields & {
    level3NodeCount?: number;
    unitCount?: number;
  },
): ProjectSetupRoute => {
  const initialSetupComplete = isInitialSetupComplete(project);
  const hasPartialSetup = Boolean(
    (project.project_type?.trim() || project.project_structure?.trim()) &&
      !initialSetupComplete,
  );

  const base = {
    projectId: project.id,
    projectName: project.name,
    projectType: project.project_type?.trim().toUpperCase() ?? null,
    projectStructure: project.project_structure?.trim().toUpperCase() ?? null,
    initialSetupComplete,
    hasPartialSetup,
    level3NodeCount: project.level3NodeCount ?? 0,
    unitCount: project.unitCount ?? 0,
    stepsCompleted: {
      initialSetup: initialSetupComplete,
      level3Hierarchy: (project.level3NodeCount ?? 0) > 0,
      units: (project.unitCount ?? 0) > 0,
    },
  };

  if (!initialSetupComplete) {
    return {
      ...base,
      nextStep: "initial_setup",
      nextStepKey: "INITIAL_SETUP",
      nextStepTitle: "Project Type & Structure",
      nextStepDescription: hasPartialSetup
        ? "Complete both Level 1 (project type) and Level 2 (structure). Setup is incomplete in the database."
        : "Select the project type and structure to configure inventory hierarchy.",
      level3Label: null,
      level3TypeCode: null,
    };
  }

  const config = getHierarchyConfig(
    project.project_type as ProjectType,
    project.project_structure!,
  )!;

  const level3Label = config.level3.default_label;

  return {
    ...base,
    nextStep: "level3_hierarchy",
    nextStepKey: config.level3.type_code,
    nextStepTitle: `${level3Label} Setup`,
    nextStepDescription: `Add and manage ${level3Label.toLowerCase()}s for this project.`,
    level3Label,
    level3TypeCode: config.level3.type_code,
    projectTypeName: getProjectTypeLabel(project.project_type!),
    projectStructureName: getProjectStructureLabel(
      project.project_type!,
      project.project_structure!,
    ),
    hasLevel4: Boolean(
      config.level4 ||
        (config.level4_modes && config.level4_modes.length > 0),
    ),
  };
};

export const setupStepToView = (step: ProjectSetupStep): ProjectSetupView => {
  if (step === "initial_setup") return "initial_setup";
  if (step === "level3_hierarchy") return "level3_hierarchy";
  return "units";
};

const setupStorageKey = (projectId: string) => `project_setup_${projectId}`;

/** @deprecated Local cache only; never used to skip setup — API/DB is source of truth */
export const readLocalProjectSetup = (
  projectId: string,
): Pick<ProjectSetupFields, "project_type" | "project_structure"> | null => {
  const saved = localStorage.getItem(setupStorageKey(projectId));
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

export const clearLocalProjectSetup = (projectId: string) => {
  localStorage.removeItem(setupStorageKey(projectId));
  try {
    localStorage.removeItem(`inventory_builder_draft_${projectId}`);
  } catch {
    /* ignore */
  }
};

export const writeLocalProjectSetup = (
  project: Pick<
    ProjectSetupFields,
    "id" | "project_type" | "project_structure"
  >,
) => {
  if (!isInitialSetupComplete(project)) return;

  localStorage.setItem(
    setupStorageKey(project.id),
    JSON.stringify({
      project_type: project.project_type,
      project_structure: project.project_structure,
    }),
  );
};

const mapApiStatusToRoute = (
  status: Record<string, unknown>,
  projectId: string,
  fallbackName?: string,
): ProjectSetupRoute => ({
  projectId: (status.projectId as string) ?? projectId,
  projectName: (status.projectName as string) ?? fallbackName ?? "Project",
  projectType: (status.projectType as string) ?? null,
  projectStructure: (status.projectStructure as string) ?? null,
  inventorySubcategory: (status.inventorySubcategory as string) ?? null,
  initialSetupComplete: Boolean(status.initialSetupComplete),
  hasPartialSetup: Boolean(status.hasPartialSetup),
  nextStep: (status.nextStep as ProjectSetupStep) ?? "initial_setup",
  nextStepKey: (status.nextStepKey as string) ?? "INITIAL_SETUP",
  nextStepTitle: (status.nextStepTitle as string) ?? "Project Setup",
  nextStepDescription: (status.nextStepDescription as string) ?? "",
  level3Label: (status.level3Label as string) ?? null,
  level3TypeCode: (status.level3TypeCode as string) ?? null,
  projectTypeName: status.projectTypeName as string | undefined,
  projectStructureName: status.projectStructureName as string | undefined,
  level3NodeCount: (status.level3NodeCount as number) ?? 0,
  unitCount: (status.unitCount as number) ?? 0,
  hasInventory: Boolean(status.hasInventory),
  stepsCompleted: (status.stepsCompleted as ProjectSetupRoute["stepsCompleted"]) ?? {
    initialSetup: false,
    level3Hierarchy: false,
    units: false,
  },
  hasLevel4: status.hasLevel4 as boolean | undefined,
  configError: status.configError as string | undefined,
});

/**
 * Fetches setup status from the database only (GET /projects/:id/setup-status).
 * Does not merge localStorage — prevents false "setup complete" for new projects.
 */
export const fetchProjectSetupStatus = async (
  projectId: string,
  fallbackName?: string,
): Promise<{ route: ProjectSetupRoute; diagnostics?: ProjectSetupDiagnostics }> => {
  const res = await axiosInstance.get(`/projects/${projectId}/setup-status`);
  const status = res.data?.data ?? res.data;
  const route = mapApiStatusToRoute(status, projectId, fallbackName);
  const diagnostics = res.data?.diagnostics as ProjectSetupDiagnostics | undefined;

  if (!route.initialSetupComplete) {
    clearLocalProjectSetup(projectId);
  }

  return { route, diagnostics };
};

/** Whether the project has towers, floors, hierarchy nodes, or units in the database. */
export const projectHasInventoryFromRoute = (
  route: Pick<ProjectSetupRoute, "hasInventory" | "level3NodeCount" | "unitCount">,
): boolean =>
  Boolean(
    route.hasInventory ||
      (route.level3NodeCount ?? 0) > 0 ||
      (route.unitCount ?? 0) > 0,
  );

export const fetchProjectHasInventory = async (
  projectId: string,
): Promise<boolean> => {
  const res = await axiosInstance.get(`/projects/${projectId}/has-inventory`);
  return Boolean(res.data?.data?.hasInventory);
};

export const resetProjectInitialSetup = async (projectId: string) => {
  const res = await axiosInstance.post(
    `/projects/${projectId}/reset-initial-setup`,
  );
  clearLocalProjectSetup(projectId);
  const setupStatus = res.data?.setupStatus
    ? mapApiStatusToRoute(res.data.setupStatus, projectId)
    : undefined;
  return {
    message: res.data?.message as string,
    setupStatus,
  };
};

export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  const error = err as {
    response?: { data?: { error?: string; details?: string } };
    message?: string;
  };
  return (
    error.response?.data?.details ??
    error.response?.data?.error ??
    error.message ??
    fallback
  );
};

export const saveProjectInitialSetup = async (
  projectId: string,
  fields: {
    project_type?: ProjectType;
    project_structure?: string | null;
    inventory_subcategory?: string | null;
  },
) => {
  const res = await axiosInstance.put(
    `/projects/${projectId}/initial-setup`,
    fields,
  );
  const saved = res.data?.data ?? res.data;
  if (!saved?.id) {
    throw new Error("Server did not return saved project data.");
  }
  const setupStatus: ProjectSetupRoute | undefined = res.data?.setupStatus
    ? mapApiStatusToRoute(res.data.setupStatus, projectId, saved?.name)
    : undefined;
  const verified = res.data?.verified;

  if (saved?.id && isInitialSetupComplete(saved)) {
    writeLocalProjectSetup({
      id: saved.id,
      project_type: saved.project_type,
      project_structure: saved.project_structure,
    });
  } else if (saved?.id) {
    clearLocalProjectSetup(saved.id);
  }

  return { saved, setupStatus, verified, message: res.data?.message as string };
};

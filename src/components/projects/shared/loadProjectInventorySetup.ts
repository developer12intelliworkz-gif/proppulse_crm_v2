import axiosInstance from "@/api/axiosInstance";
import { PROJECT_TYPES } from "@/components/inventory/inventoryConstants";
import { mapBackendToInventory } from "@/components/inventory/inventoryBackendMapping";
import { loadInventoryDraft } from "@/components/inventory/inventoryPersist";
import {
  fetchProjectSetupStatus,
  fetchProjectHasInventory,
  projectHasInventoryFromRoute,
} from "@/components/projects/setup/projectSetupHelpers";
import type { ProjectInventoryTypeValue } from "./ProjectInventoryTypeFields";
import type { ProjectTypeKey } from "@/store/types/inventory";

const projectTypeFromSubcategory = (
  subcategory: string,
): ProjectTypeKey | "" => {
  for (const [typeKey, typeDef] of Object.entries(PROJECT_TYPES)) {
    if (typeDef.subcategories.some((s) => s.key === subcategory)) {
      return typeKey as ProjectTypeKey;
    }
  }
  return "";
};

const buildSetup = (
  projectType: ProjectTypeKey,
  subcategory: string,
): ProjectInventoryTypeValue => ({
  projectType,
  subcategory,
});

/** Load saved project type + subcategory from API, with fallbacks. */
export const loadProjectInventorySetup = async (
  projectId: string,
): Promise<{
  setup: ProjectInventoryTypeValue | null;
  initialSetupComplete: boolean;
  hasInventory: boolean;
}> => {
  let initialSetupComplete = false;
  let hasInventory = false;

  try {
    const { route } = await fetchProjectSetupStatus(projectId);
    initialSetupComplete = Boolean(route.initialSetupComplete);
    hasInventory = projectHasInventoryFromRoute(route);

    const subcategoryFromRoute = route.inventorySubcategory?.trim() || null;

    if (subcategoryFromRoute) {
      const projectType =
        projectTypeFromSubcategory(subcategoryFromRoute) ||
        mapBackendToInventory(
          route.projectType ?? "",
          route.projectStructure ?? "",
        )?.projectType;
      if (projectType) {
        return {
          setup: buildSetup(projectType, subcategoryFromRoute),
          initialSetupComplete,
          hasInventory,
        };
      }
    }

    if (route.projectType && route.projectStructure) {
      const mapped = mapBackendToInventory(
        route.projectType,
        route.projectStructure,
      );
      if (mapped) {
        return {
          setup: buildSetup(mapped.projectType, mapped.subcategory),
          initialSetupComplete,
          hasInventory,
        };
      }
    }
  } catch {
    // fall through to project row + draft
  }

  if (!hasInventory) {
    try {
      hasInventory = await fetchProjectHasInventory(projectId);
    } catch {
      hasInventory = false;
    }
  }

  try {
    const res = await axiosInstance.get(`/projects/${projectId}`);
    const row = res.data?.data ?? res.data;
    const subcategoryFromRow =
      typeof row?.inventory_subcategory === "string"
        ? row.inventory_subcategory.trim()
        : "";
    const projectTypeRaw = row?.project_type?.trim().toUpperCase() ?? "";
    const projectStructureRaw = row?.project_structure?.trim().toUpperCase() ?? "";

    if (subcategoryFromRow) {
      const projectType =
        projectTypeFromSubcategory(subcategoryFromRow) ||
        mapBackendToInventory(projectTypeRaw, projectStructureRaw)?.projectType;
      if (projectType) {
        return {
          setup: buildSetup(projectType, subcategoryFromRow),
          initialSetupComplete: Boolean(projectTypeRaw && projectStructureRaw),
          hasInventory,
        };
      }
    }

    if (projectTypeRaw && projectStructureRaw) {
      const mapped = mapBackendToInventory(projectTypeRaw, projectStructureRaw);
      if (mapped) {
        return {
          setup: buildSetup(mapped.projectType, mapped.subcategory),
          initialSetupComplete: true,
          hasInventory,
        };
      }
    }
  } catch {
    // fall through
  }

  const draft = loadInventoryDraft(projectId);
  if (draft?.projectType && draft?.subcategory) {
    return {
      setup: buildSetup(
        draft.projectType as ProjectTypeKey,
        draft.subcategory,
      ),
      initialSetupComplete,
      hasInventory,
    };
  }

  return { setup: null, initialSetupComplete, hasInventory };
};

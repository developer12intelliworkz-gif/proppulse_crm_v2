import type { ProjectTypeKey } from "@/store/types/inventory";
import type { ProjectType } from "@/components/projects/setup/projectHierarchyConfig";

export interface BackendProjectSetup {
  project_type: ProjectType;
  project_structure: string;
}

const SUBCATEGORY_TO_BACKEND: Record<string, BackendProjectSetup> = {
  flat_apartment: { project_type: "RESIDENTIAL", project_structure: "TOWER_BASED" },
  bungalow: { project_type: "RESIDENTIAL", project_structure: "VILLA_ROW" },
  weekend_home: { project_type: "RESIDENTIAL", project_structure: "VILLA_ROW" },
  farmhouse: { project_type: "RESIDENTIAL", project_structure: "VILLA_ROW" },
  residential_plot: { project_type: "LAND", project_structure: "PLOT_ONLY" },
  showroom: { project_type: "COMMERCIAL", project_structure: "SHOP_WISE" },
  shop: { project_type: "COMMERCIAL", project_structure: "SHOP_WISE" },
  office: { project_type: "COMMERCIAL", project_structure: "FLOOR_WISE" },
  commercial_plot: { project_type: "LAND", project_structure: "PLOT_ONLY" },
  warehouse: { project_type: "INDUSTRIAL", project_structure: "SHED_BASED" },
  cold_storage: { project_type: "INDUSTRIAL", project_structure: "SHED_BASED" },
  industry_plot: { project_type: "LAND", project_structure: "PLOT_ONLY" },
};

const BACKEND_TO_INVENTORY: Record<
  string,
  { projectType: ProjectTypeKey; subcategory: string }
> = {
  "RESIDENTIAL|TOWER_BASED": {
    projectType: "residential",
    subcategory: "flat_apartment",
  },
  "RESIDENTIAL|VILLA_ROW": {
    projectType: "residential",
    subcategory: "bungalow",
  },
  "RESIDENTIAL|PLOT_BASED": {
    projectType: "residential",
    subcategory: "residential_plot",
  },
  "LAND|PLOT_ONLY": {
    projectType: "residential",
    subcategory: "residential_plot",
  },
  "COMMERCIAL|SHOP_WISE": {
    projectType: "commercial",
    subcategory: "shop",
  },
  "COMMERCIAL|FLOOR_WISE": {
    projectType: "commercial",
    subcategory: "office",
  },
  "INDUSTRIAL|SHED_BASED": {
    projectType: "industry",
    subcategory: "warehouse",
  },
};

export const mapSubcategoryToBackend = (
  inventoryType: ProjectTypeKey,
  subcategory: string,
): BackendProjectSetup => {
  const mapped = SUBCATEGORY_TO_BACKEND[subcategory];
  if (mapped) return mapped;

  const typeMap: Record<ProjectTypeKey, ProjectType> = {
    residential: "RESIDENTIAL",
    commercial: "COMMERCIAL",
    industry: "INDUSTRIAL",
  };

  return {
    project_type: typeMap[inventoryType],
    project_structure: "NA",
  };
};

export const mapBackendToInventory = (
  projectType: string,
  projectStructure: string,
): { projectType: ProjectTypeKey; subcategory: string } | null => {
  const key = `${projectType.toUpperCase()}|${projectStructure.toUpperCase()}`;
  return BACKEND_TO_INVENTORY[key] ?? null;
};

/** Preferred unit_types.unit_name codes per inventory subcategory */
export const SUBCATEGORY_UNIT_TYPE_CODES: Record<string, string[]> = {
  flat_apartment: ["FLAT"],
  bungalow: ["VILLA", "ROW_HOUSE"],
  weekend_home: ["VILLA", "ROW_HOUSE"],
  farmhouse: ["VILLA", "ROW_HOUSE"],
  residential_plot: ["PLOT"],
  showroom: ["SHOWROOM", "SHOP"],
  shop: ["SHOP", "KIOSK"],
  office: ["OFFICE", "SUITE"],
  commercial_plot: ["PLOT"],
  warehouse: ["WAREHOUSE_UNIT", "BAY_UNIT"],
  cold_storage: ["WAREHOUSE_UNIT", "BAY_UNIT"],
  industry_plot: ["INDUSTRIAL_PLOT", "PLOT"],
};

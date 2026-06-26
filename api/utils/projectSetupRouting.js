import { PROJECT_CONFIG } from "../config/projectConfig.js";

export const SETUP_STEP_KEYS = {
  INITIAL_SETUP: "INITIAL_SETUP",
  LEVEL3_HIERARCHY: "LEVEL3_HIERARCHY",
  UNITS: "UNITS",
};

export const validateProjectTypeAndStructure = (
  projectType,
  projectStructure,
) => {
  if (!projectType?.trim()) {
    return { valid: false, error: "Project type (Level 1) is required" };
  }

  const validTypes = PROJECT_CONFIG.level1_project_types.map((t) => t.code);
  if (!validTypes.includes(projectType)) {
    return { valid: false, error: `Invalid project type: ${projectType}` };
  }

  if (!projectStructure?.trim()) {
    return { valid: false, error: "Project structure (Level 2) is required" };
  }

  const structures =
    PROJECT_CONFIG.level2_project_structures[projectType] || [];
  const structureCodes = structures.map((s) => s.code);
  if (!structureCodes.includes(projectStructure)) {
    return {
      valid: false,
      error: `Invalid project structure "${projectStructure}" for type ${projectType}`,
    };
  }

  const hierarchyConfig =
    PROJECT_CONFIG.level3_level4_hierarchy_by_structure?.[projectType]?.[
      projectStructure
    ];

  if (!hierarchyConfig) {
    return {
      valid: false,
      error: "No hierarchy configuration found for this type and structure",
    };
  }

  const typeMeta = PROJECT_CONFIG.level1_project_types.find(
    (t) => t.code === projectType,
  );
  const structureMeta = structures.find((s) => s.code === projectStructure);

  return {
    valid: true,
    hierarchyConfig,
    typeMeta,
    structureMeta,
  };
};

/**
 * Decides the next step in the inventory setup flow after verifying DB fields.
 * Storage: projects.project_type (L1), projects.project_structure (L2)
 * Hierarchy nodes: project_hierarchy_nodes (L3/L4 by type_code from PROJECT_CONFIG)
 */
/** Normalize DB values; unknown codes are cleared so setup cannot be skipped by mistake */
export const normalizeProjectSetupFields = (projectRow = {}) => {
  const validTypes = PROJECT_CONFIG.level1_project_types.map((t) => t.code);

  let projectType =
    typeof projectRow.project_type === "string" && projectRow.project_type.trim()
      ? projectRow.project_type.trim().toUpperCase()
      : null;
  let projectStructure =
    typeof projectRow.project_structure === "string" &&
    projectRow.project_structure.trim()
      ? projectRow.project_structure.trim().toUpperCase()
      : null;

  if (projectType && !validTypes.includes(projectType)) {
    projectType = null;
  }

  const validation =
    projectType && projectStructure
      ? validateProjectTypeAndStructure(projectType, projectStructure)
      : { valid: false, error: null };

  if (projectStructure && !validation.valid) {
    const structuresForType =
      PROJECT_CONFIG.level2_project_structures[projectType] || [];
    const validStructureCodes = structuresForType.map((s) => s.code);
    if (!validStructureCodes.includes(projectStructure)) {
      projectStructure = null;
    }
  }

  const finalValidation =
    projectType && projectStructure
      ? validateProjectTypeAndStructure(projectType, projectStructure)
      : { valid: false, error: validation.error };

  return {
    projectType,
    projectStructure,
    validation: finalValidation,
    hasPartialSetup:
      Boolean(projectType || projectStructure) && !finalValidation.valid,
  };
};

export const buildProjectSetupStatus = (
  projectRow,
  { level3NodeCount = 0, unitCount = 0 } = {},
) => {
  const { id, name } = projectRow;
  const normalized = normalizeProjectSetupFields(projectRow);
  const { projectType, projectStructure, validation, hasPartialSetup } = normalized;

  const initialSetupComplete = validation.valid === true;

  const inventorySubcategory =
    typeof projectRow.inventory_subcategory === "string" &&
    projectRow.inventory_subcategory.trim()
      ? projectRow.inventory_subcategory.trim()
      : null;

  const base = {
    projectId: id,
    projectName: name,
    projectType,
    projectStructure,
    inventorySubcategory,
    initialSetupComplete,
    hasPartialSetup,
    level3NodeCount,
    unitCount,
    stepsCompleted: {
      initialSetup: initialSetupComplete,
      level3Hierarchy: level3NodeCount > 0,
      units: unitCount > 0,
    },
  };

  if (!initialSetupComplete) {
    const description = hasPartialSetup
      ? "Complete both project type (Level 1) and structure (Level 2). Partial setup was found in the database and must be finished."
      : "Select the project type and structure to configure inventory hierarchy.";

    return {
      ...base,
      nextStep: "initial_setup",
      nextStepKey: SETUP_STEP_KEYS.INITIAL_SETUP,
      nextStepTitle: "Project Type & Structure",
      nextStepDescription: validation.error || description,
      configError: validation.error || (hasPartialSetup ? "INCOMPLETE_SETUP" : null),
      level3Label: null,
      level3TypeCode: null,
      hierarchyConfig: null,
    };
  }

  const { hierarchyConfig, typeMeta, structureMeta } = validation; // validation.valid is true here
  const level3 = hierarchyConfig.level3;
  const level3Label = level3.default_label;
  const nextStepTitle = `${level3Label} Setup`;

  return {
    ...base,
    nextStep: "level3_hierarchy",
    nextStepKey: level3.type_code,
    nextStepTitle,
    nextStepDescription: `Add and manage ${level3Label.toLowerCase()}s for this project.`,
    level3Label,
    level3TypeCode: level3.type_code,
    projectTypeName: typeMeta?.name ?? projectType,
    projectStructureName: structureMeta?.name ?? projectStructure,
    hasLevel4: Boolean(
      hierarchyConfig.level4 ||
        (Array.isArray(hierarchyConfig.level4_modes) &&
          hierarchyConfig.level4_modes.length > 0),
    ),
    hierarchyConfig: {
      level3: {
        type_code: level3.type_code,
        default_label: level3.default_label,
        required: level3.required,
        examples: level3.examples ?? [],
      },
      inventoryUnitTypes: hierarchyConfig.inventory_unit_types ?? [],
    },
  };
};

export const getNextStepAfterProjectSetup = buildProjectSetupStatus;

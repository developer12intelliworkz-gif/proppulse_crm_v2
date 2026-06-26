import {
  getAllowedUnitTypes,
  type ProjectType,
} from "./projectHierarchyConfig";

export function formatUnitTypeLabel(code: string): string {
  return String(code)
    .trim()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export type UnitTypeOption = { id: string; unit_name: string };

const STRUCTURAL_NODE_CODES = new Set([
  "TOWER",
  "FLOOR",
  "BLOCK",
  "WING",
  "SECTOR",
  "PHASE",
  "CLUSTER",
  "STREET",
  "ZONE",
  "BUILDING",
  "WAREHOUSE_BUILDING",
  "BAY",
  "FACTORY",
  "COMPLEX",
  "NA",
]);

/**
 * Picks unit_type_id from types synced at project setup (step 1).
 */
export function resolveUnitTypeId(
  unitTypes: UnitTypeOption[],
  options?: {
    hierarchyTypeCode?: string | null;
    allowedCodes?: string[];
  },
): string | null {
  if (unitTypes.length === 0) return null;
  if (unitTypes.length === 1) return unitTypes[0].id;

  const nodeCode = options?.hierarchyTypeCode?.trim().toUpperCase();
  if (nodeCode && !STRUCTURAL_NODE_CODES.has(nodeCode)) {
    const byNode = unitTypes.find(
      (t) => t.unit_name.trim().toUpperCase() === nodeCode,
    );
    if (byNode) return byNode.id;
  }

  const allowed = options?.allowedCodes ?? [];
  for (const code of allowed) {
    const match = unitTypes.find(
      (t) => t.unit_name.trim().toUpperCase() === code.trim().toUpperCase(),
    );
    if (match) return match.id;
  }

  return unitTypes[0]?.id ?? null;
}

export function getAllowedUnitTypeCodes(
  projectType?: string | null,
  projectStructure?: string | null,
): string[] {
  if (!projectType || !projectStructure) return [];
  return getAllowedUnitTypes(
    projectType as ProjectType,
    projectStructure,
  );
}

export function getAllowedUnitTypeLabels(
  projectType?: string | null,
  projectStructure?: string | null,
): string[] {
  return getAllowedUnitTypeCodes(projectType, projectStructure).map(
    formatUnitTypeLabel,
  );
}

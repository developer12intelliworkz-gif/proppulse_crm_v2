import { PROJECT_CONFIG } from "../config/projectConfig.js";

export function formatUnitTypeLabel(code) {
  return String(code)
    .trim()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function getInventoryUnitTypeCodes(projectType, projectStructure) {
  const config =
    PROJECT_CONFIG.level3_level4_hierarchy_by_structure?.[projectType]?.[
      projectStructure
    ];
  return config?.inventory_unit_types ?? [];
}

/**
 * Creates missing unit_types rows from PROJECT_CONFIG when L1+L2 are saved.
 * unit_name is stored as the config code (e.g. FLAT) for backend matching.
 */
export async function syncProjectUnitTypes(
  client,
  projectId,
  projectType,
  projectStructure,
) {
  const codes = getInventoryUnitTypeCodes(projectType, projectStructure);
  if (!codes.length) return [];

  const ids = [];
  for (const rawCode of codes) {
    const unitName = String(rawCode).trim().toUpperCase();
    if (!unitName) continue;

    const existing = await client.query(
      `SELECT id FROM unit_types
       WHERE project_id = $1 AND UPPER(BTRIM(unit_name)) = $2
       LIMIT 1`,
      [projectId, unitName],
    );

    if (existing.rowCount > 0) {
      ids.push(existing.rows[0].id);
      continue;
    }

    const inserted = await client.query(
      `INSERT INTO unit_types (
         project_id, unit_name, label, carpet_area_sqft, super_builtup_area_sqft, is_active
       ) VALUES ($1, $2, NULL, 1, NULL, true)
       RETURNING id`,
      [projectId, unitName],
    );
    ids.push(inserted.rows[0].id);
  }

  return ids;
}

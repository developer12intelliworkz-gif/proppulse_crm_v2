/**
 * Permanently removes all inventory / layout data for a project (hard DELETE).
 * Does not modify project_type, project_structure, or inventory_subcategory on projects.
 */

async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1
     LIMIT 1`,
    [tableName],
  );
  return result.rowCount > 0;
}

export async function hardDeleteProjectInventory(client, projectId) {
  const deleted = {
    units: 0,
    hierarchyNodes: 0,
    legacyTowers: 0,
    legacyFloors: 0,
    unitTypes: 0,
    quotations: 0,
  };

  if (await tableExists(client, "quotations")) {
    const quotationsRes = await client.query(
      `DELETE FROM quotations WHERE project_id = $1`,
      [projectId],
    );
    deleted.quotations = quotationsRes.rowCount ?? 0;
  }

  if (await tableExists(client, "project_units")) {
    const unitsRes = await client.query(
      `DELETE FROM project_units WHERE project_id = $1`,
      [projectId],
    );
    deleted.units = unitsRes.rowCount ?? 0;
  }

  if (
    (await tableExists(client, "project_floors")) &&
    (await tableExists(client, "project_towers"))
  ) {
    const floorsRes = await client.query(
      `DELETE FROM project_floors
       WHERE tower_id IN (SELECT id FROM project_towers WHERE project_id = $1)`,
      [projectId],
    );
    deleted.legacyFloors = floorsRes.rowCount ?? 0;
  }

  if (await tableExists(client, "project_towers")) {
    const towersRes = await client.query(
      `DELETE FROM project_towers WHERE project_id = $1`,
      [projectId],
    );
    deleted.legacyTowers = towersRes.rowCount ?? 0;
  }

  if (await tableExists(client, "project_hierarchy_nodes")) {
    await client.query(
      `DELETE FROM project_hierarchy_nodes
       WHERE project_id = $1 AND parent_id IS NOT NULL`,
      [projectId],
    );
    const hierarchyRes = await client.query(
      `DELETE FROM project_hierarchy_nodes WHERE project_id = $1`,
      [projectId],
    );
    deleted.hierarchyNodes = hierarchyRes.rowCount ?? 0;
  }

  if (await tableExists(client, "unit_types")) {
    const typesRes = await client.query(
      `DELETE FROM unit_types WHERE project_id = $1`,
      [projectId],
    );
    deleted.unitTypes = typesRes.rowCount ?? 0;
  }

  return deleted;
}

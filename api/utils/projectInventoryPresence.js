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

/** True when the project has any towers, floors, hierarchy nodes, or units. */
export async function projectHasInventory(client, projectId) {
  if (await tableExists(client, "project_units")) {
    const units = await client.query(
      `SELECT 1 FROM project_units
       WHERE project_id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [projectId],
    );
    if (units.rowCount > 0) return true;
  }

  if (await tableExists(client, "project_hierarchy_nodes")) {
    const nodes = await client.query(
      `SELECT 1 FROM project_hierarchy_nodes
       WHERE project_id = $1 AND deleted_at IS NULL
       LIMIT 1`,
      [projectId],
    );
    if (nodes.rowCount > 0) return true;
  }

  if (await tableExists(client, "project_towers")) {
    const towers = await client.query(
      `SELECT 1 FROM project_towers WHERE project_id = $1 LIMIT 1`,
      [projectId],
    );
    if (towers.rowCount > 0) return true;
  }

  return false;
}

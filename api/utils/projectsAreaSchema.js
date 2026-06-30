import pool from "../../database/config.js";

let cached = null;

export async function getProjectsAreaSchema(forceRefresh = false) {
  if (cached && !forceRefresh) return cached;

  const columnsResult = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'projects'`,
  );

  const columns = new Set(columnsResult.rows.map((r) => r.column_name));

  cached = {
    hasDefaultAreaUnit: columns.has("default_area_unit"),
  };

  return cached;
}

export async function ensureProjectsAreaColumns() {
  const schema = await getProjectsAreaSchema(true);
  if (schema.hasDefaultAreaUnit) return schema;

  await pool.query(`
    ALTER TABLE projects
      ADD COLUMN IF NOT EXISTS default_area_unit TEXT NOT NULL DEFAULT 'sqft'
  `);
  await pool.query(`
    UPDATE projects SET default_area_unit = 'sqft' WHERE default_area_unit IS NULL
  `);

  cached = null;
  return getProjectsAreaSchema(true);
}

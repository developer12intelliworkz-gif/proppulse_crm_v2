import pool from "../../database/config.js";

let cached = null;

export async function getUnitTypesSchema(forceRefresh = false) {
  if (cached && !forceRefresh) return cached;

  const columnsResult = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'unit_types'`,
  );

  const columns = new Set(columnsResult.rows.map((r) => r.column_name));

  cached = {
    hasAreaFieldsMode: columns.has("area_fields_mode"),
    hasLabel: columns.has("label"),
    hasIsActive: columns.has("is_active"),
  };

  return cached;
}

export async function ensureUnitTypesAreaColumns() {
  const schema = await getUnitTypesSchema(true);
  if (schema.hasAreaFieldsMode) return schema;

  await pool.query(`
    ALTER TABLE unit_types
      ADD COLUMN IF NOT EXISTS area_fields_mode TEXT NOT NULL DEFAULT 'carpet_only'
  `);
  await pool.query(`
    UPDATE unit_types
    SET area_fields_mode = 'carpet_only'
    WHERE area_fields_mode IS NULL OR area_fields_mode = 'both'
  `);

  cached = null;
  return getUnitTypesSchema(true);
}

export function areaFieldsModeSelectSql(hasColumn) {
  return hasColumn
    ? "COALESCE(area_fields_mode, 'carpet_only') AS area_fields_mode"
    : "'carpet_only'::text AS area_fields_mode";
}

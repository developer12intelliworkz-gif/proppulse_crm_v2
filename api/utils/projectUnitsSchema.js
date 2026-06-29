import pool from "../../database/config.js";

let cachedSchema = null;

function pickColumn(columns, candidates) {
  for (const name of candidates) {
    if (columns.has(name)) return name;
  }
  return null;
}

/**
 * Introspects project_units (and related tables) so API queries work across
 * older DB schemas (integer ids, different column names).
 */
export async function getProjectUnitsSchema(forceRefresh = false) {
  if (cachedSchema && !forceRefresh) return cachedSchema;

  const columnsResult = await pool.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'project_units'`,
  );

  const columns = new Map(
    columnsResult.rows.map((row) => [row.column_name, row.data_type]),
  );

  const hierarchyTable = await pool.query(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = 'project_hierarchy_nodes'
     LIMIT 1`,
  );

  const carpetCol = pickColumn(columns, [
    "carpet_area_sqft",
    "carpet_area",
    "carpet",
  ]);
  const superBuiltupCol = pickColumn(columns, [
    "super_builtup_area_sqft",
    "super_builtup_area",
    "super_built_up_area",
    "saleable_area",
    "builtup_area",
  ]);
  const leadCol = pickColumn(columns, ["lead_id", "assigned_lead_id"]);
  const priceCol = pickColumn(columns, [
    "price",
    "base_price",
    "unit_price",
    "rate",
  ]);
  const baseRateCol = columns.has("base_rate") ? "base_rate" : null;
  const totalPriceCol = columns.has("total_price") ? "total_price" : null;
  const carpetAreaUnitCol = columns.has("carpet_area_unit")
    ? "carpet_area_unit"
    : null;
  const superBuiltupAreaUnitCol = columns.has("super_builtup_area_unit")
    ? "super_builtup_area_unit"
    : null;
  const hasParkingCol = columns.has("has_parking") ? "has_parking" : null;
  const parkingCountCol = columns.has("parking_count") ? "parking_count" : null;
  const amenitiesCol = pickColumn(columns, ["amenities"]);
  const facingCol = pickColumn(columns, ["facing"]);
  const unitNumberCol = pickColumn(columns, ["unit_number", "unit_no", "name"]);
  const statusCol = pickColumn(columns, ["status"]);
  const hierarchyNodeCol = pickColumn(columns, ["hierarchy_node_id"]);
  const towerCol = columns.has("tower_id") ? "tower_id" : null;
  const floorCol = columns.has("floor_id") ? "floor_id" : null;
  const deletedAtCol = pickColumn(columns, ["deleted_at"]);

  const leadDataType = leadCol ? columns.get(leadCol) : null;

  cachedSchema = {
    columns,
    carpetCol,
    superBuiltupCol,
    leadCol,
    priceCol,
    baseRateCol,
    totalPriceCol,
    carpetAreaUnitCol,
    superBuiltupAreaUnitCol,
    hasParkingCol,
    parkingCountCol,
    amenitiesCol,
    facingCol,
    unitNumberCol,
    statusCol,
    hierarchyNodeCol,
    towerCol,
    floorCol,
    deletedAtCol,
    hasHierarchyTable: hierarchyTable.rowCount > 0,
    leadJoinOnInteger: leadDataType === "integer" || leadDataType === "bigint",
    leadJoinOnText:
      leadDataType === "text" ||
      leadDataType === "character varying" ||
      leadDataType === "uuid",
  };

  return cachedSchema;
}

export function sqlUnitAlias(columnName, outputAlias, fallbackSql = "NULL") {
  if (!columnName) return `${fallbackSql} AS ${outputAlias}`;
  return `u.${columnName} AS ${outputAlias}`;
}

export function buildLeadJoin(schema) {
  if (!schema.leadCol) return "";
  if (schema.leadJoinOnInteger) {
    return `LEFT JOIN leads l ON l.id = u.${schema.leadCol}`;
  }
  return `LEFT JOIN leads l ON CAST(l.id AS TEXT) = u.${schema.leadCol}`;
}

export function buildHierarchyJoin(schema) {
  if (!schema.hasHierarchyTable || !schema.hierarchyNodeCol) {
    return {
      join: "",
      nameSelect: "NULL::text AS hierarchy_name",
      typeSelect: "NULL::text AS hierarchy_type_code",
    };
  }

  return {
    join: `LEFT JOIN project_hierarchy_nodes h ON h.id = u.${schema.hierarchyNodeCol}`,
    nameSelect: "h.name AS hierarchy_name",
    typeSelect: "h.type_code AS hierarchy_type_code",
  };
}

export function buildDeletedFilter(schema, alias = "u") {
  if (!schema.deletedAtCol) return "";
  return `AND ${alias}.${schema.deletedAtCol} IS NULL`;
}

/** SELECT list + JOIN for project_units list/detail endpoints */
export function buildUnitSelectSql(schema) {
  const hierarchy = buildHierarchyJoin(schema);

  const select = [
    "u.id",
    "u.project_id",
    schema.hierarchyNodeCol
      ? `u.${schema.hierarchyNodeCol} AS hierarchy_node_id`
      : "NULL::integer AS hierarchy_node_id",
    hierarchy.nameSelect,
    hierarchy.typeSelect,
    schema.unitNumberCol
      ? `u.${schema.unitNumberCol} AS unit_number`
      : "CAST(u.id AS TEXT) AS unit_number",
    schema.statusCol ? `u.${schema.statusCol} AS status` : "'available'::text AS status",
    sqlUnitAlias(schema.carpetCol, "carpet_area_sqft"),
    sqlUnitAlias(schema.superBuiltupCol, "super_builtup_area_sqft"),
    schema.facingCol ? `u.${schema.facingCol} AS facing` : "NULL::text AS facing",
    schema.amenitiesCol
      ? `u.${schema.amenitiesCol} AS amenities`
      : "'[]'::jsonb AS amenities",
    sqlUnitAlias(schema.priceCol, "price", "NULL::numeric"),
    sqlUnitAlias(schema.baseRateCol, "base_rate", "NULL::numeric"),
    sqlUnitAlias(schema.totalPriceCol, "total_price", "NULL::numeric"),
    schema.carpetAreaUnitCol
      ? `u.${schema.carpetAreaUnitCol} AS carpet_area_unit`
      : "'sqft'::text AS carpet_area_unit",
    schema.superBuiltupAreaUnitCol
      ? `u.${schema.superBuiltupAreaUnitCol} AS super_builtup_area_unit`
      : "'sqft'::text AS super_builtup_area_unit",
    schema.hasParkingCol
      ? `u.${schema.hasParkingCol} AS has_parking`
      : "false AS has_parking",
    schema.parkingCountCol
      ? `u.${schema.parkingCountCol} AS parking_count`
      : "NULL::integer AS parking_count",
    schema.columns.has("unit_type_id")
      ? "u.unit_type_id AS unit_type_id"
      : "NULL::integer AS unit_type_id",
    sqlUnitAlias(schema.leadCol, "lead_id", "NULL::text"),
    "u.created_at",
    "u.updated_at",
  ].join(",\n");

  return { select, hierarchy };
}

/**
 * Legacy DBs require tower_id / floor_id (NOT NULL) while UI sends hierarchy_node_id.
 * L3 node (no parent) → tower_id = node id, floor_id = node id
 * L4 node (has parent) → tower_id = parent id, floor_id = node id
 */
async function tableExists(tableName) {
  const res = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
    [tableName],
  );
  return res.rowCount > 0;
}

async function findTowerIdForHierarchy(projectId, hierarchyNodeId, parentId) {
  const towerCandidate = parentId || hierarchyNodeId;

  if (await tableExists("project_towers")) {
    const direct = await pool.query(
      `SELECT id FROM project_towers
       WHERE id = $1 AND project_id = $2
       LIMIT 1`,
      [towerCandidate, projectId],
    );
    if (direct.rowCount > 0) return direct.rows[0].id;

    const nodeRes = await pool.query(
      `SELECT name FROM project_hierarchy_nodes
       WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [towerCandidate, projectId],
    );
    if (nodeRes.rowCount > 0) {
      const byName = await pool.query(
        `SELECT id FROM project_towers
         WHERE project_id = $1 AND LOWER(BTRIM(tower_name)) = LOWER(BTRIM($2))
         LIMIT 1`,
        [projectId, nodeRes.rows[0].name],
      );
      if (byName.rowCount > 0) return byName.rows[0].id;

      const created = await pool.query(
        `INSERT INTO project_towers (project_id, tower_name, total_floors, created_at, updated_at)
         VALUES ($1, $2, 1, NOW(), NOW())
         RETURNING id`,
        [projectId, nodeRes.rows[0].name],
      );
      return created.rows[0].id;
    }
  }

  return towerCandidate;
}

async function findFloorIdForHierarchy(projectId, towerId, hierarchyNodeId) {
  if (await tableExists("project_floors")) {
    const direct = await pool.query(
      `SELECT id FROM project_floors
       WHERE id = $1 AND project_id = $2
       LIMIT 1`,
      [hierarchyNodeId, projectId],
    );
    if (direct.rowCount > 0) return direct.rows[0].id;

    const nodeRes = await pool.query(
      `SELECT name FROM project_hierarchy_nodes
       WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [hierarchyNodeId, projectId],
    );
    if (nodeRes.rowCount > 0) {
      const byName = await pool.query(
        `SELECT id FROM project_floors
         WHERE project_id = $1
           AND tower_id = $2
           AND LOWER(BTRIM(floor_number)) = LOWER(BTRIM($3))
         LIMIT 1`,
        [projectId, towerId, nodeRes.rows[0].name],
      );
      if (byName.rowCount > 0) return byName.rows[0].id;

      const created = await pool.query(
        `INSERT INTO project_floors (
           project_id, tower_id, floor_number, floor_type, created_at, updated_at
         ) VALUES ($1, $2, $3, 'residential', NOW(), NOW())
         RETURNING id`,
        [projectId, towerId, nodeRes.rows[0].name],
      );
      return created.rows[0].id;
    }
  }

  return hierarchyNodeId;
}

export async function resolveLegacyTowerFloor(projectId, hierarchyNodeId) {
  const schema = await getProjectUnitsSchema();
  if (!schema.towerCol && !schema.floorCol) return {};

  const nodeRes = await pool.query(
    `SELECT id, parent_id, name
     FROM project_hierarchy_nodes
     WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [hierarchyNodeId, projectId],
  );

  if (nodeRes.rowCount === 0) {
    throw new Error("Hierarchy node not found for this project");
  }

  const node = nodeRes.rows[0];
  const legacy = {};

  if (schema.towerCol) {
    legacy.tower_id = await findTowerIdForHierarchy(
      projectId,
      hierarchyNodeId,
      node.parent_id,
    );
  }
  if (schema.floorCol) {
    if (node.parent_id) {
      legacy.floor_id = await findFloorIdForHierarchy(
        projectId,
        legacy.tower_id,
        hierarchyNodeId,
      );
    } else {
      legacy.floor_id = await findFloorIdForHierarchy(
        projectId,
        legacy.tower_id,
        hierarchyNodeId,
      );
    }
  }

  return legacy;
}

export function buildUnitInsertQuery(schema, projectId, payload, legacy = {}) {
  const cols = [];
  const placeholders = [];
  const values = [];
  let i = 1;

  const add = (col, val, cast) => {
    if (!schema.columns.has(col)) return;
    cols.push(col);
    placeholders.push(cast ? `$${i}::${cast}` : `$${i}`);
    values.push(val);
    i += 1;
  };

  add("project_id", projectId);
  add("hierarchy_node_id", payload.hierarchy_node_id);
  add("tower_id", legacy.tower_id);
  add("floor_id", legacy.floor_id);
  add("unit_number", payload.unit_number);
  add("unit_type_id", payload.unit_type_id);
  add("status", payload.status);
  add("carpet_area_sqft", payload.carpet_area_sqft);
  add("super_builtup_area_sqft", payload.super_builtup_area_sqft);
  add("carpet_area_unit", payload.carpet_area_unit);
  add("super_builtup_area_unit", payload.super_builtup_area_unit);
  add("base_rate", payload.base_rate);
  add("total_price", payload.total_price);
  add("facing", payload.facing);
  add("has_parking", payload.has_parking);
  add("parking_count", payload.parking_count);
  add("amenities", JSON.stringify(payload.amenities ?? []), "jsonb");
  add("price", payload.price);
  add("lead_id", payload.lead_id);

  if (schema.columns.has("created_at")) {
    cols.push("created_at");
    placeholders.push("CURRENT_TIMESTAMP");
  }
  if (schema.columns.has("updated_at")) {
    cols.push("updated_at");
    placeholders.push("CURRENT_TIMESTAMP");
  }

  const returning = buildUnitReturningColumns(schema);

  const sql = `INSERT INTO project_units (${cols.join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING ${returning}`;

  return { sql, values };
}

export function buildUnitUpdateQuery(schema, projectId, unitId, payload, legacy = {}) {
  const sets = [];
  const values = [];
  let i = 1;

  const add = (col, val, cast) => {
    if (!schema.columns.has(col)) return;
    sets.push(`${col} = ${cast ? `$${i}::${cast}` : `$${i}`}`);
    values.push(val);
    i += 1;
  };

  add("hierarchy_node_id", payload.hierarchy_node_id);
  if (legacy.tower_id !== undefined) add("tower_id", legacy.tower_id);
  if (legacy.floor_id !== undefined) add("floor_id", legacy.floor_id);
  add("unit_number", payload.unit_number);
  add("unit_type_id", payload.unit_type_id);
  add("status", payload.status);
  add("carpet_area_sqft", payload.carpet_area_sqft);
  add("super_builtup_area_sqft", payload.super_builtup_area_sqft);
  add("carpet_area_unit", payload.carpet_area_unit);
  add("super_builtup_area_unit", payload.super_builtup_area_unit);
  add("base_rate", payload.base_rate);
  add("total_price", payload.total_price);
  add("facing", payload.facing);
  add("has_parking", payload.has_parking);
  add("parking_count", payload.parking_count);
  add("amenities", JSON.stringify(payload.amenities ?? []), "jsonb");
  add("price", payload.price);
  add("lead_id", payload.lead_id);

  if (schema.columns.has("updated_at")) {
    sets.push("updated_at = CURRENT_TIMESTAMP");
  }

  const deletedFilter = schema.deletedAtCol
    ? `AND ${schema.deletedAtCol} IS NULL`
    : "";
  const returning = buildUnitReturningColumns(schema);

  values.push(unitId, projectId);

  const sql = `UPDATE project_units
    SET ${sets.join(", ")}
    WHERE id = $${i} AND project_id = $${i + 1}
    ${deletedFilter}
    RETURNING ${returning}`;

  return { sql, values };
}

function buildUnitReturningColumns(schema) {
  const cols = ["id", "project_id"];
  if (schema.hierarchyNodeCol) cols.push(schema.hierarchyNodeCol);
  if (schema.unitNumberCol) cols.push(schema.unitNumberCol);
  if (schema.statusCol) cols.push(schema.statusCol);
  if (schema.carpetCol) cols.push(schema.carpetCol);
  if (schema.superBuiltupCol) cols.push(schema.superBuiltupCol);
  if (schema.facingCol) cols.push(schema.facingCol);
  if (schema.amenitiesCol) cols.push(schema.amenitiesCol);
  if (schema.priceCol) cols.push(schema.priceCol);
  if (schema.baseRateCol) cols.push(schema.baseRateCol);
  if (schema.totalPriceCol) cols.push(schema.totalPriceCol);
  if (schema.carpetAreaUnitCol) cols.push(schema.carpetAreaUnitCol);
  if (schema.superBuiltupAreaUnitCol) cols.push(schema.superBuiltupAreaUnitCol);
  if (schema.hasParkingCol) cols.push(schema.hasParkingCol);
  if (schema.parkingCountCol) cols.push(schema.parkingCountCol);
  if (schema.columns.has("unit_type_id")) cols.push("unit_type_id");
  if (schema.leadCol) cols.push(schema.leadCol);
  if (schema.columns.has("created_at")) cols.push("created_at");
  if (schema.columns.has("updated_at")) cols.push("updated_at");
  return cols.join(", ");
}

export function normalizeUnitRow(row, schema) {
  const baseRate =
    row.base_rate !== undefined && row.base_rate !== null
      ? Number(row.base_rate)
      : null;
  const totalPrice =
    row.total_price !== undefined && row.total_price !== null
      ? Number(row.total_price)
      : null;

  return {
    ...row,
    carpet_area_sqft:
      row.carpet_area_sqft !== undefined && row.carpet_area_sqft !== null
        ? Number(row.carpet_area_sqft)
        : null,
    super_builtup_area_sqft:
      row.super_builtup_area_sqft !== undefined &&
      row.super_builtup_area_sqft !== null
        ? Number(row.super_builtup_area_sqft)
        : null,
    lead_id:
      row.lead_id !== undefined && row.lead_id !== null
        ? String(row.lead_id)
        : null,
    lead_name: row.lead_name || null,
    lead_phone: row.lead_phone || null,
    hierarchy_name: row.hierarchy_name || null,
    hierarchy_type_code: row.hierarchy_type_code || null,
    base_rate: Number.isFinite(baseRate) ? baseRate : null,
    total_price: Number.isFinite(totalPrice) ? totalPrice : null,
    price:
      row.price !== undefined && row.price !== null ? Number(row.price) : null,
    has_any_quotation: Boolean(row.has_any_quotation),
    _schema: {
      carpetCol: schema.carpetCol,
      superBuiltupCol: schema.superBuiltupCol,
      leadCol: schema.leadCol,
      priceCol: schema.priceCol,
      baseRateCol: schema.baseRateCol,
      totalPriceCol: schema.totalPriceCol,
    },
  };
}

/** Per-unit rate (₹/sqft): prefer base_rate; price column often stores total. */
export function resolveUnitRatePerUnit(row) {
  const baseRate =
    row.base_rate != null && row.base_rate !== ""
      ? Number(row.base_rate)
      : null;
  if (baseRate != null && Number.isFinite(baseRate) && baseRate > 0) {
    return baseRate;
  }

  const carpet = Number(row.carpet_area_sqft) || 0;
  const superBuiltup = Number(row.super_builtup_area_sqft) || 0;
  const totalArea = carpet + superBuiltup;

  const totalPrice =
    row.total_price != null && row.total_price !== ""
      ? Number(row.total_price)
      : null;
  if (
    totalPrice != null &&
    Number.isFinite(totalPrice) &&
    totalPrice > 0 &&
    totalArea > 0
  ) {
    return totalPrice / totalArea;
  }

  const price =
    row.price != null && row.price !== "" ? Number(row.price) : null;
  if (price != null && Number.isFinite(price) && price > 0) {
    if (totalArea > 0 && price > totalArea * 1000) {
      return price / totalArea;
    }
    return price;
  }

  return 0;
}

/** Total basic price: (carpet + super built-up) × rate, or stored total. */
export function resolveUnitBasicPrice(row) {
  const carpet = Number(row.carpet_area_sqft) || 0;
  const superBuiltup = Number(row.super_builtup_area_sqft) || 0;
  const totalArea = carpet + superBuiltup;

  const totalPrice =
    row.total_price != null && row.total_price !== ""
      ? Number(row.total_price)
      : null;
  if (totalPrice != null && Number.isFinite(totalPrice) && totalPrice > 0) {
    return Math.round((totalPrice + Number.EPSILON) * 100) / 100;
  }

  const price =
    row.price != null && row.price !== "" ? Number(row.price) : null;
  if (
    price != null &&
    Number.isFinite(price) &&
    price > 0 &&
    totalArea > 0 &&
    price > totalArea * 1000
  ) {
    return Math.round((price + Number.EPSILON) * 100) / 100;
  }

  const rate = resolveUnitRatePerUnit(row);
  if (totalArea > 0 && rate > 0) {
    return Math.round((totalArea * rate + Number.EPSILON) * 100) / 100;
  }

  return 0;
}

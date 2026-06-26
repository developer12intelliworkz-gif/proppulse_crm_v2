import pool from "../../database/config.js";
import {
  getProjectUnitsSchema,
  buildUnitSelectSql,
  buildDeletedFilter,
  resolveLegacyTowerFloor,
  buildUnitInsertQuery,
  buildUnitUpdateQuery,
} from "../utils/projectUnitsSchema.js";

const ALLOWED_STATUSES = new Set(["available", "booked", "sold", "blocked"]);

const ALLOWED_FACINGS = new Set([
  "east",
  "west",
  "north",
  "south",
  "north_east",
  "north_west",
  "south_east",
  "south_west",
]);

const ALLOWED_AREA_UNITS = new Set(["sqft", "sqyd"]);

const projectExists = async (projectId) => {
  const result = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL",
    [projectId],
  );

  return result.rowCount > 0;
};

const getHierarchyNode = async (projectId, hierarchyNodeId) => {
  const result = await pool.query(
    `SELECT id, parent_id, type_code, name
     FROM project_hierarchy_nodes
     WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
    [hierarchyNodeId, projectId],
  );

  return result.rows[0] || null;
};

const leadBelongsToProject = async (projectId, leadId) => {
  const numericLeadId = Number(leadId);
  const useIntegerLead =
    Number.isInteger(numericLeadId) && String(numericLeadId) === String(leadId).trim();

  const result = await pool.query(
    useIntegerLead
      ? `SELECT 1
         FROM leads
         WHERE id = $1
           AND interested_project_id::text = $2::text
           AND is_active = TRUE
         LIMIT 1`
      : `SELECT 1
         FROM leads
         WHERE CAST(id AS TEXT) = $1
           AND interested_project_id::text = $2::text
           AND is_active = TRUE
         LIMIT 1`,
    [useIntegerLead ? numericLeadId : String(leadId).trim(), String(projectId)],
  );

  return result.rowCount > 0;
};

const normalizeUnitNumber = (value) => value.trim().toUpperCase();

const sanitizeAmenities = (amenities) => {
  if (amenities === undefined || amenities === null) {
    return [];
  }

  if (!Array.isArray(amenities)) {
    throw new Error("amenities must be an array of strings");
  }

  return [
    ...new Set(
      amenities
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean),
    ),
  ];
};

const parseOptionalNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  return parsed;
};

const parseRequiredPositiveNumber = (value, fieldName) => {
  const parsed = parseOptionalNumber(value, fieldName);

  if (parsed === null || parsed <= 0) {
    throw new Error(`${fieldName} must be greater than 0`);
  }

  return parsed;
};

const mapUnitRow = (row) => ({
  id: row.id,
  project_id: row.project_id,
  hierarchy_node_id: row.hierarchy_node_id,
  nodeId: row.hierarchy_node_id,
  node_name: row.node_name,
  node_type_code: row.node_type_code,
  unit_number: row.unit_number,
  status: row.status,
  carpet_area_sqft:
    row.carpet_area_sqft !== null ? Number(row.carpet_area_sqft) : null,
  super_builtup_area_sqft:
    row.super_builtup_area_sqft !== null
      ? Number(row.super_builtup_area_sqft)
      : null,
  facing: row.facing,
  amenities: Array.isArray(row.amenities) ? row.amenities : [],
  price: row.price !== null ? Number(row.price) : null,
  unit_type_id:
    row.unit_type_id !== null && row.unit_type_id !== undefined
      ? Number(row.unit_type_id)
      : null,
  base_rate: row.base_rate !== null ? Number(row.base_rate) : null,
  total_price: row.total_price !== null ? Number(row.total_price) : null,
  carpet_area_unit: row.carpet_area_unit ?? "sqft",
  super_builtup_area_unit: row.super_builtup_area_unit ?? "sqft",
  has_parking: Boolean(row.has_parking),
  parking_count:
    row.parking_count !== null && row.parking_count !== undefined
      ? Number(row.parking_count)
      : null,
  lead_id: row.lead_id,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const buildUnitPayload = async (projectId, payload, currentUnit = null) => {
  const hierarchyNodeId =
    payload.hierarchy_node_id ||
    payload.nodeId ||
    currentUnit?.hierarchy_node_id;
  const unitNumberInput = payload.unit_number ?? currentUnit?.unit_number;
  const status = (payload.status ?? currentUnit?.status ?? "available")
    .toString()
    .trim()
    .toLowerCase();
  const carpetArea = payload.carpet_area_sqft ?? currentUnit?.carpet_area_sqft;
  const superBuiltupArea =
    payload.super_builtup_area_sqft ?? currentUnit?.super_builtup_area_sqft;
  const facing = payload.facing ?? currentUnit?.facing ?? null;
  const amenitiesSource = payload.amenities ?? currentUnit?.amenities ?? [];
  const price = payload.price ?? currentUnit?.price;
  const baseRate = payload.base_rate ?? currentUnit?.base_rate ?? null;
  const carpetAreaUnit =
    payload.carpet_area_unit ??
    payload.carpetAreaUnit ??
    currentUnit?.carpet_area_unit ??
    "sqft";
  const superBuiltupAreaUnit =
    payload.super_builtup_area_unit ??
    payload.superBuiltupAreaUnit ??
    currentUnit?.super_builtup_area_unit ??
    "sqft";
  const hasParking =
    payload.has_parking ?? payload.hasParking ?? currentUnit?.has_parking ?? false;
  const parkingCount =
    payload.parking_count ??
    payload.parkingCount ??
    currentUnit?.parking_count ??
    null;
  const leadId =
    payload.lead_id ?? payload.leadId ?? currentUnit?.lead_id ?? null;

  if (!hierarchyNodeId) {
    throw new Error("hierarchy_node_id is required");
  }

  if (!unitNumberInput || !String(unitNumberInput).trim()) {
    throw new Error("unit_number is required");
  }

  if (!ALLOWED_STATUSES.has(status)) {
    throw new Error(
      "status must be one of available, booked, sold, or blocked",
    );
  }

  const hierarchyNode = await getHierarchyNode(projectId, hierarchyNodeId);
  if (!hierarchyNode) {
    throw new Error("Hierarchy node not found for this project");
  }

  // project_units.unit_type_id is NOT NULL in your DB.
  // UnitForm/UnitList payloads currently don't send unit_type_id, so infer it.
  const providedUnitTypeId =
    payload.unit_type_id ?? payload.unitTypeId ?? null;
  let inferredUnitTypeId = providedUnitTypeId;

  const needsInference =
    inferredUnitTypeId === null ||
    inferredUnitTypeId === undefined ||
    String(inferredUnitTypeId).trim() === "";

  if (needsInference) {
    const typeCode = hierarchyNode.type_code
      ? String(hierarchyNode.type_code).trim()
      : "";

    // hierarchy type_code can be structural (e.g. TOWER/FLOOR) and not a unit type.
    const structuralCodes = new Set(["TOWER", "FLOOR", "BLOCK", "WING"]);

    if (typeCode && !structuralCodes.has(typeCode.toUpperCase())) {
      const matched = await pool.query(
        `SELECT id
         FROM unit_types
         WHERE project_id = $1
           AND LOWER(BTRIM(unit_name)) = LOWER(BTRIM($2))
         LIMIT 1`,
        [projectId, typeCode],
      );
      if (matched.rowCount > 0) {
        inferredUnitTypeId = matched.rows[0].id;
      }
    }

    // If we couldn't match by type_code, fall back to a single unit type (only safe if only one exists).
    if (inferredUnitTypeId === null || inferredUnitTypeId === undefined) {
      const all = await pool.query(
        `SELECT id
         FROM unit_types
         WHERE project_id = $1 AND COALESCE(is_active, true) = true
         ORDER BY id`,
        [projectId],
      );

      if (all.rowCount === 1) {
        inferredUnitTypeId = all.rows[0].id;
      } else {
        throw new Error(
          `unit_type_id is required for this database schema (NOT NULL). ` +
            `Please select a Unit Type in the UI (or send unit_type_id in the request). ` +
            `Available unit types for this project: ${all.rowCount}.`,
        );
      }
    }
  }

  const sanitizedLeadId =
    leadId === null || leadId === undefined || leadId === ""
      ? null
      : String(leadId).trim();

  if (sanitizedLeadId) {
    const leadExists = await pool.query(
      `SELECT 1 FROM leads WHERE id::text = $1::text AND is_active = TRUE LIMIT 1`,
      [sanitizedLeadId],
    );
    if (leadExists.rowCount === 0) {
      throw new Error("Assigned lead was not found");
    }
    if (!(await leadBelongsToProject(projectId, sanitizedLeadId))) {
      throw new Error(
        "Assigned lead is not linked to this project. Update the lead's project or leave unassigned.",
      );
    }
  }

  const sanitizedFacingRaw =
    facing === null || facing === undefined || String(facing).trim() === ""
      ? null
      : String(facing).trim().toLowerCase();

  if (sanitizedFacingRaw && !ALLOWED_FACINGS.has(sanitizedFacingRaw)) {
    throw new Error("facing must be a valid direction value");
  }

  const normalizedCarpetAreaUnit = String(carpetAreaUnit).trim().toLowerCase();
  const normalizedSuperAreaUnit = String(superBuiltupAreaUnit)
    .trim()
    .toLowerCase();

  if (!ALLOWED_AREA_UNITS.has(normalizedCarpetAreaUnit)) {
    throw new Error("carpet_area_unit must be sqft or sqyd");
  }
  if (!ALLOWED_AREA_UNITS.has(normalizedSuperAreaUnit)) {
    throw new Error("super_builtup_area_unit must be sqft or sqyd");
  }

  const parsedCarpetArea = parseRequiredPositiveNumber(
    carpetArea,
    "carpet_area_sqft",
  );
  const parsedSuperBuiltupArea = parseOptionalNumber(
    superBuiltupArea,
    "super_builtup_area_sqft",
  );
  const parsedBaseRate = parseOptionalNumber(baseRate, "base_rate");
  const parsedPrice = parseOptionalNumber(price, "price");

  if (parsedSuperBuiltupArea !== null && parsedSuperBuiltupArea < 0) {
    throw new Error("super_builtup_area_sqft cannot be negative");
  }

  if (parsedBaseRate !== null && parsedBaseRate < 0) {
    throw new Error("base_rate cannot be negative");
  }

  if (parsedPrice !== null && parsedPrice < 0) {
    throw new Error("price cannot be negative");
  }

  const parsedHasParking = Boolean(hasParking);
  let parsedParkingCount = null;
  if (parsedHasParking) {
    const count = parseOptionalNumber(parkingCount, "parking_count");
    if (count === null || !Number.isInteger(count) || count < 1) {
      throw new Error("parking_count must be an integer greater than 0 when has_parking is true");
    }
    parsedParkingCount = count;
  }

  const computedTotalPrice =
    parsedBaseRate !== null && parsedBaseRate > 0
      ? (parsedSuperBuiltupArea !== null && parsedSuperBuiltupArea > 0 ? parsedSuperBuiltupArea : parsedCarpetArea) * parsedBaseRate
      : null;
  const resolvedPrice = computedTotalPrice ?? parsedPrice;

  const numericUnitTypeId =
    inferredUnitTypeId === null ||
    inferredUnitTypeId === undefined ||
    String(inferredUnitTypeId).trim() === ""
      ? null
      : Number(inferredUnitTypeId);

  if (numericUnitTypeId === null || !Number.isFinite(numericUnitTypeId)) {
    throw new Error(
      "unit_type_id is required and must be a valid number for this project_units schema.",
    );
  }

  return {
    hierarchy_node_id: hierarchyNode.id,
    unit_number: normalizeUnitNumber(String(unitNumberInput)),
    unit_type_id: numericUnitTypeId,
    status,
    carpet_area_sqft: parsedCarpetArea,
    super_builtup_area_sqft: parsedSuperBuiltupArea,
    carpet_area_unit: normalizedCarpetAreaUnit,
    super_builtup_area_unit: normalizedSuperAreaUnit,
    base_rate: parsedBaseRate,
    total_price: computedTotalPrice,
    facing: sanitizedFacingRaw,
    has_parking: parsedHasParking,
    parking_count: parsedParkingCount,
    amenities: sanitizeAmenities(amenitiesSource),
    price: resolvedPrice,
    lead_id: sanitizedLeadId,
  };
};

const getUnitByIdInternal = async (projectId, unitId) => {
  const schema = await getProjectUnitsSchema();
  const unitSelect = buildUnitSelectSql(schema);
  const deletedFilter = buildDeletedFilter(schema);

  const result = await pool.query(
    `SELECT ${unitSelect.select}
     FROM project_units u
     ${unitSelect.hierarchy.join}
     WHERE u.id = $1
       AND u.project_id = $2
       ${deletedFilter}`,
    [unitId, projectId],
  );

  return result.rows[0] || null;
};

const ensureUniqueUnitNumber = async (
  projectId,
  unitNumber,
  excludeUnitId = null,
) => {
  const schema = await getProjectUnitsSchema();
  if (!schema.unitNumberCol) return;

  const params = [projectId, unitNumber];
  let query = `SELECT id
    FROM project_units
    WHERE project_id = $1
      AND UPPER(BTRIM(${schema.unitNumberCol})) = UPPER(BTRIM($2))`;

  if (schema.deletedAtCol) {
    query += ` AND ${schema.deletedAtCol} IS NULL`;
  }

  if (excludeUnitId) {
    params.push(excludeUnitId);
    query += ` AND id <> $3`;
  }

  const result = await pool.query(query, params);

  if (result.rowCount > 0) {
    throw new Error("Unit number already exists for this project");
  }
};

export const createUnit = async (req, res) => {
  const { projectId } = req.params;

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const payload = await buildUnitPayload(projectId, req.body);
    await ensureUniqueUnitNumber(projectId, payload.unit_number);

    const schema = await getProjectUnitsSchema();
    const legacy = await resolveLegacyTowerFloor(
      projectId,
      payload.hierarchy_node_id,
    );
    const { sql, values } = buildUnitInsertQuery(
      schema,
      projectId,
      payload,
      legacy,
    );

    const result = await pool.query(sql, values);

    res.status(201).json({
      message: "Unit created successfully",
      data: mapUnitRow(result.rows[0]),
    });
  } catch (error) {
    if (error.message?.includes("already exists")) {
      return res.status(409).json({ error: error.message });
    }

    if (
      error.message?.includes("required") ||
      error.message?.includes("must be") ||
      error.message?.includes("not found") ||
      error.message?.includes("negative")
    ) {
      return res.status(400).json({ error: error.message });
    }

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "Unit number already exists for this project" });
    }

    if (error.code === "23502") {
      return res.status(400).json({
        error: "Missing required unit fields for your database schema",
        details: error.message,
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        error:
          "Tower/floor reference is invalid. Ensure hierarchy nodes match towers/floors in this project.",
        details: error.message,
      });
    }

    console.error("createUnit error:", error);
    res
      .status(500)
      .json({ error: "Failed to create unit", details: error.message });
  }
};

export const getUnitsByProject = async (req, res) => {
  const { projectId } = req.params;
  const { hierarchy_node_id, nodeId, status, search } = req.query;

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const schema = await getProjectUnitsSchema();
    const unitSelect = buildUnitSelectSql(schema);
    const deletedFilter = buildDeletedFilter(schema);

    const params = [projectId];
    let index = 2;
    let query = `SELECT ${unitSelect.select}
      FROM project_units u
      ${unitSelect.hierarchy.join}
      WHERE u.project_id = $1
        ${deletedFilter}`;

    const hierarchyNodeId = hierarchy_node_id || nodeId;
    if (hierarchyNodeId) {
      query += ` AND u.hierarchy_node_id = $${index++}`;
      params.push(hierarchyNodeId);
    }

    if (status) {
      query += ` AND u.status = $${index++}`;
      params.push(String(status).trim().toLowerCase());
    }

    if (search && schema.unitNumberCol) {
      query += ` AND u.${schema.unitNumberCol} ILIKE $${index++}`;
      params.push(`%${String(search).trim()}%`);
    }

    query += ` ORDER BY ${schema.unitNumberCol ? `u.${schema.unitNumberCol}` : "u.id"} ASC`;

    const result = await pool.query(query, params);

    res.json({
      count: result.rowCount,
      data: result.rows.map(mapUnitRow),
    });
  } catch (error) {
    console.error("getUnitsByProject error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch units", details: error.message });
  }
};

export const getUnitById = async (req, res) => {
  const { projectId, unitId } = req.params;

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const unit = await getUnitByIdInternal(projectId, unitId);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    res.json({ data: mapUnitRow(unit) });
  } catch (error) {
    console.error("getUnitById error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch unit", details: error.message });
  }
};

export const updateUnit = async (req, res) => {
  const { projectId, unitId } = req.params;

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const existingUnit = await getUnitByIdInternal(projectId, unitId);
    if (!existingUnit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    const payload = await buildUnitPayload(projectId, req.body, existingUnit);
    await ensureUniqueUnitNumber(projectId, payload.unit_number, unitId);

    const schema = await getProjectUnitsSchema();
    const legacy = await resolveLegacyTowerFloor(
      projectId,
      payload.hierarchy_node_id,
    );
    const { sql, values } = buildUnitUpdateQuery(
      schema,
      projectId,
      unitId,
      payload,
      legacy,
    );

    const result = await pool.query(sql, values);

    res.json({
      message: "Unit updated successfully",
      data: mapUnitRow(result.rows[0]),
    });
  } catch (error) {
    if (error.message?.includes("already exists")) {
      return res.status(409).json({ error: error.message });
    }

    if (
      error.message?.includes("required") ||
      error.message?.includes("must be") ||
      error.message?.includes("not found") ||
      error.message?.includes("negative")
    ) {
      return res.status(400).json({ error: error.message });
    }

    if (error.code === "23505") {
      return res
        .status(409)
        .json({ error: "Unit number already exists for this project" });
    }

    console.error("updateUnit error:", error);
    res
      .status(500)
      .json({ error: "Failed to update unit", details: error.message });
  }
};

export const deleteUnit = async (req, res) => {
  const { projectId, unitId } = req.params;

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `UPDATE project_units
       SET deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND project_id = $2
         AND deleted_at IS NULL
       RETURNING
         id,
         project_id,
         hierarchy_node_id,
         unit_number,
         status,
         carpet_area_sqft,
         super_builtup_area_sqft,
         facing,
         amenities,
         price,
         lead_id,
         created_at,
         updated_at`,
      [unitId, projectId],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Unit not found or already deleted" });
    }

    res.json({
      message: "Unit deleted successfully",
      data: mapUnitRow(result.rows[0]),
    });
  } catch (error) {
    console.error("deleteUnit error:", error);
    res
      .status(500)
      .json({ error: "Failed to delete unit", details: error.message });
  }
};

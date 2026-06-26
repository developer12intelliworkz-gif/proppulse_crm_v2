import pool from "../../database/config.js";

const slugifyUnitName = (label) => {
  const slug = String(label)
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toUpperCase();
  return slug || "UNIT";
};

const projectExists = async (projectId) => {
  const result = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL",
    [projectId],
  );
  return result.rowCount > 0;
};

export const getUnitTypeLabels = async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `SELECT id, unit_name, label, is_active, carpet_area_sqft, super_builtup_area_sqft
       FROM unit_types
       WHERE project_id = $1 AND COALESCE(is_active, true) = true
       ORDER BY COALESCE(NULLIF(TRIM(label), ''), unit_name)`,
      [projectId],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("getUnitTypeLabels error:", error);
    res.status(500).json({ error: "Failed to fetch unit type labels" });
  }
};

export const createUnitTypeLabel = async (req, res) => {
  const { projectId } = req.params;
  const { label } = req.body;

  if (!label || !String(label).trim()) {
    return res.status(400).json({ error: "label is required" });
  }
  if (String(label).trim().length > 50) {
    return res.status(400).json({ error: "label must be 50 characters or fewer" });
  }

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const trimmedLabel = String(label).trim();
    const unitName = slugifyUnitName(trimmedLabel);

    const existing = await pool.query(
      `SELECT id FROM unit_types
       WHERE project_id = $1
         AND COALESCE(is_active, true) = true
         AND (
           LOWER(BTRIM(COALESCE(label, ''))) = LOWER(BTRIM($2))
           OR UPPER(BTRIM(unit_name)) = $3
         )
       LIMIT 1`,
      [projectId, trimmedLabel, unitName],
    );
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: "Unit type label already exists for this project" });
    }

    const result = await pool.query(
      `INSERT INTO unit_types (
         project_id, unit_name, label, carpet_area_sqft, super_builtup_area_sqft, is_active
       ) VALUES ($1, $2, $3, 1, NULL, true)
       RETURNING id, unit_name, label, is_active, carpet_area_sqft, super_builtup_area_sqft`,
      [projectId, unitName, trimmedLabel],
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error("createUnitTypeLabel error:", error);
    res.status(500).json({ error: "Failed to create unit type label" });
  }
};

export const updateUnitTypeLabel = async (req, res) => {
  const { projectId, typeId } = req.params;
  const { label, is_active } = req.body;

  try {
    const updates = [];
    const values = [];
    let index = 1;

    if (label !== undefined) {
      if (!String(label).trim()) {
        return res.status(400).json({ error: "label cannot be empty" });
      }
      updates.push(`label = $${index++}`);
      values.push(String(label).trim());
      updates.push(`unit_name = $${index++}`);
      values.push(slugifyUnitName(label));
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${index++}`);
      values.push(Boolean(is_active));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(typeId, projectId);
    const result = await pool.query(
      `UPDATE unit_types
       SET ${updates.join(", ")}
       WHERE id = $${index} AND project_id = $${index + 1}
       RETURNING id, unit_name, label, is_active, carpet_area_sqft, super_builtup_area_sqft`,
      values,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Unit type not found" });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("updateUnitTypeLabel error:", error);
    res.status(500).json({ error: "Failed to update unit type label" });
  }
};

export const deleteUnitTypeLabel = async (req, res) => {
  const { projectId, typeId } = req.params;
  try {
    const result = await pool.query(
      `UPDATE unit_types
       SET is_active = false
       WHERE id = $1 AND project_id = $2
       RETURNING id`,
      [typeId, projectId],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Unit type not found" });
    }
    res.json({ message: "Unit type deactivated" });
  } catch (error) {
    console.error("deleteUnitTypeLabel error:", error);
    res.status(500).json({ error: "Failed to deactivate unit type" });
  }
};

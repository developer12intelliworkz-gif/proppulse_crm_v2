import pool from "../../database/config.js";
import { syncProjectUnitTypes } from "../utils/syncProjectUnitTypes.js";

export const createUnitType = async (req, res) => {
  const { projectId } = req.params;
  const {
    unit_name,
    carpet_area_sqft,
    super_builtup_area_sqft = null,
  } = req.body;

  if (!unit_name || !carpet_area_sqft) {
    return res
      .status(400)
      .json({ error: "unit_name and carpet_area_sqft required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO unit_types (project_id, unit_name, carpet_area_sqft, super_builtup_area_sqft)
       VALUES ($1, $2, $3, $4)
       RETURNING id, unit_name, carpet_area_sqft, super_builtup_area_sqft`,
      [projectId, unit_name.trim(), carpet_area_sqft, super_builtup_area_sqft],
    );

    res
      .status(201)
      .json({ message: "Unit type created", data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create unit type" });
  }
};

export const getUnitTypesByProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const projectRow = await pool.query(
      `SELECT project_type, project_structure FROM projects
       WHERE id = $1 AND deleted_at IS NULL`,
      [projectId],
    );

    if (
      projectRow.rows[0]?.project_type &&
      projectRow.rows[0]?.project_structure
    ) {
      await syncProjectUnitTypes(
        pool,
        projectId,
        projectRow.rows[0].project_type,
        projectRow.rows[0].project_structure,
      );
    }

    const result = await pool.query(
      `SELECT id, unit_name, label, is_active, carpet_area_sqft, super_builtup_area_sqft
       FROM unit_types
       WHERE project_id = $1 AND COALESCE(is_active, true) = true
       ORDER BY COALESCE(NULLIF(TRIM(label), ''), unit_name)`,
      [projectId],
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error("getUnitTypesByProject error:", err);
    res.status(500).json({ error: "Failed to fetch unit types" });
  }
};

// Update aur Delete bhi similar pattern se bana dena (bahut similar hai)

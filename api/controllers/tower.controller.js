// controllers/project/tower.controller.js

import pool from "../../database/config.js";

// Helper: Check if project exists
const checkProjectExists = async (projectId) => {
  const result = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL",
    [projectId]
  );
  return result.rowCount > 0;
};

// ==================== CREATE TOWER ====================
export const createTower = async (req, res) => {
  const { projectId } = req.params;
  const {
    tower_name,
    total_floors,
    total_units,
    tower_type = "residential",
    lift_count,
    parking_type,
    description,
  } = req.body;

  if (!tower_name || !total_floors) {
    return res.status(400).json({
      error: "tower_name and total_floors are required",
    });
  }

  if (isNaN(total_floors) || total_floors < 1) {
    return res.status(400).json({
      error: "total_floors must be a positive number",
    });
  }

  try {
    const projectExists = await checkProjectExists(projectId);
    if (!projectExists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `INSERT INTO project_towers (
        project_id,
        tower_name,
        total_floors,
        total_units,
        tower_type,
        lift_count,
        parking_type,
        description,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, tower_name, total_floors, total_units, tower_type, lift_count, parking_type, description, created_at`,
      [
        projectId,
        tower_name.trim(),
        total_floors,
        total_units || null,
        tower_type,
        lift_count || null,
        parking_type || null,
        description || null,
      ]
    );

    res.status(201).json({
      message: "Tower created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("createTower error:", error);
    res
      .status(500)
      .json({ error: "Failed to create tower", details: error.message });
  }
};

// ==================== GET ALL TOWERS BY PROJECT ====================
export const getTowersByProject = async (req, res) => {
  const { projectId } = req.params;

  try {
    const projectExists = await checkProjectExists(projectId);
    if (!projectExists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `SELECT 
        id,
        tower_name,
        total_floors,
        total_units,
        tower_type,
        lift_count,
        parking_type,
        description,
        created_at,
        updated_at
      FROM project_towers 
      WHERE project_id = $1 AND deleted_at IS NULL
      ORDER BY tower_name ASC`,
      [projectId]
    );

    res.json({
      count: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error("getTowersByProject error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== UPDATE TOWER ====================
export const updateTower = async (req, res) => {
  const { projectId, towerId } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  const allowedFields = [
    "tower_name",
    "total_floors",
    "total_units",
    "tower_type",
    "lift_count",
    "parking_type",
    "description",
  ];

  const setClauses = []; // ← Fixed: Removed TypeScript annotation
  const values = [];
  let index = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (
        field === "total_floors" &&
        (isNaN(updates[field]) || updates[field] < 1)
      ) {
        return res
          .status(400)
          .json({ error: "total_floors must be a positive number" });
      }
      setClauses.push(`${field} = $${index++}`);
      values.push(updates[field]);
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  setClauses.push("updated_at = CURRENT_TIMESTAMP");
  values.push(towerId, projectId);

  try {
    const result = await pool.query(
      `UPDATE project_towers 
       SET ${setClauses.join(", ")}
       WHERE id = $${index - 1} 
         AND project_id = $${index}
         AND deleted_at IS NULL
       RETURNING id, tower_name, total_floors, total_units, tower_type`,
      values
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Tower not found or does not belong to this project" });
    }

    res.json({
      message: "Tower updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("updateTower error:", error);
    res.status(500).json({ error: "Failed to update tower" });
  }
};

// ==================== DELETE TOWER (Soft Delete) ====================
export const deleteTower = async (req, res) => {
  const { projectId, towerId } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE project_units
       SET deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE project_id = $1
         AND deleted_at IS NULL
         AND (
           floor_id IN (
             SELECT id FROM project_floors
             WHERE tower_id = $2 AND project_id = $1 AND deleted_at IS NULL
           )
           OR tower_id = $2
         )`,
      [projectId, towerId],
    );

    await client.query(
      `UPDATE project_floors
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE tower_id = $1 AND project_id = $2 AND deleted_at IS NULL`,
      [towerId, projectId],
    );

    const result = await client.query(
      `UPDATE project_towers 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL
       RETURNING id, tower_name`,
      [towerId, projectId],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Tower not found or already deleted" });
    }

    await client.query("COMMIT");

    res.json({
      message: "Tower deleted successfully (including floors and units)",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("deleteTower error:", error);
    res.status(500).json({ error: "Failed to delete tower" });
  } finally {
    client.release();
  }
};

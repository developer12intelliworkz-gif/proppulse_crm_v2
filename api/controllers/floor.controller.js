// controllers/project/floor.controller.js

import pool from "../../database/config.js";

// Helper: Check if project exists
const checkProjectExists = async (projectId) => {
  const result = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL",
    [projectId]
  );
  return result.rowCount > 0;
};

// Helper: Check if tower exists and belongs to the project
const checkTowerExists = async (projectId, towerId) => {
  const result = await pool.query(
    "SELECT id FROM project_towers WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL",
    [towerId, projectId]
  );
  return result.rowCount > 0;
};

// ==================== CREATE FLOOR ====================
export const createFloor = async (req, res) => {
  const { projectId, towerId } = req.params;
  const {
    floor_number, // e.g., 1, 2, 3, "G", "P1", "Basement"
    floor_type = "residential", // residential | commercial | parking | podium | terrace
    total_units,
    floor_area_sqft,
    description,
  } = req.body;

  if (!floor_number) {
    return res.status(400).json({ error: "floor_number is required" });
  }

  try {
    const projectExists = await checkProjectExists(projectId);
    if (!projectExists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const towerExists = await checkTowerExists(projectId, towerId);
    if (!towerExists) {
      return res
        .status(404)
        .json({ error: "Tower not found or does not belong to this project" });
    }

    // Optional: Prevent duplicate floor_number in same tower
    const duplicateCheck = await pool.query(
      "SELECT id FROM project_floors WHERE tower_id = $1 AND floor_number = $2 AND deleted_at IS NULL",
      [towerId, floor_number]
    );
    if (duplicateCheck.rowCount > 0) {
      return res
        .status(409)
        .json({ error: "Floor with this number already exists in the tower" });
    }

    const result = await pool.query(
      `INSERT INTO project_floors (
        project_id,
        tower_id,
        floor_number,
        floor_type,
        total_units,
        floor_area_sqft,
        description,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING 
        id,
        floor_number,
        floor_type,
        total_units,
        floor_area_sqft,
        description,
        created_at`,
      [
        projectId,
        towerId,
        floor_number.toString().trim(),
        floor_type,
        total_units || null,
        floor_area_sqft || null,
        description || null,
      ]
    );

    res.status(201).json({
      message: "Floor created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("createFloor error:", error);
    res
      .status(500)
      .json({ error: "Failed to create floor", details: error.message });
  }
};

// ==================== GET ALL FLOORS BY TOWER ====================
export const getFloorsByTower = async (req, res) => {
  const { projectId, towerId } = req.params;

  try {
    const projectExists = await checkProjectExists(projectId);
    if (!projectExists) {
      return res.status(404).json({ error: "Project not found" });
    }

    const towerExists = await checkTowerExists(projectId, towerId);
    if (!towerExists) {
      return res.status(404).json({ error: "Tower not found" });
    }

    const result = await pool.query(
      `SELECT 
        id,
        floor_number,
        floor_type,
        total_units,
        floor_area_sqft,
        description,
        created_at,
        updated_at
      FROM project_floors 
      WHERE tower_id = $1 AND deleted_at IS NULL
      ORDER BY 
        CASE 
          WHEN floor_number ~ '^[0-9]+$' THEN CAST(floor_number AS INTEGER)
          ELSE 999999 
        END ASC,
        floor_number ASC`,
      [towerId]
    );

    res.json({
      count: result.rowCount,
      data: result.rows,
    });
  } catch (error) {
    console.error("getFloorsByTower error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== UPDATE FLOOR ====================
export const updateFloor = async (req, res) => {
  const { projectId, towerId, floorId } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  const allowedFields = [
    "floor_number",
    "floor_type",
    "total_units",
    "floor_area_sqft",
    "description",
  ];

  const setClauses = [];
  const values = [];
  let index = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = $${index++}`);
      values.push(updates[field]);
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  setClauses.push("updated_at = CURRENT_TIMESTAMP");
  values.push(floorId, towerId, projectId);

  try {
    const result = await pool.query(
      `UPDATE project_floors 
       SET ${setClauses.join(", ")}
       WHERE id = $${index - 2}
         AND tower_id = $${index - 1}
         AND project_id = $${index}
         AND deleted_at IS NULL
       RETURNING id, floor_number, floor_type, total_units, floor_area_sqft`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Floor not found or does not belong to this tower/project",
      });
    }

    res.json({
      message: "Floor updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("updateFloor error:", error);
    res.status(500).json({ error: "Failed to update floor" });
  }
};

// ==================== DELETE FLOOR (Soft Delete) ====================
export const deleteFloor = async (req, res) => {
  const { projectId, towerId, floorId } = req.params;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE project_units
       SET deleted_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE floor_id = $1
         AND project_id = $2
         AND deleted_at IS NULL`,
      [floorId, projectId],
    );

    const result = await client.query(
      `UPDATE project_floors 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
         AND tower_id = $2 
         AND project_id = $3 
         AND deleted_at IS NULL
       RETURNING id, floor_number`,
      [floorId, towerId, projectId],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ error: "Floor not found or already deleted" });
    }

    await client.query("COMMIT");

    res.json({
      message: "Floor deleted successfully (including units)",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("deleteFloor error:", error);
    res.status(500).json({ error: "Failed to delete floor" });
  } finally {
    client.release();
  }
};

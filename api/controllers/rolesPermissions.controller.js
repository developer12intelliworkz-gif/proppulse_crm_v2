import pool from "../../database/config.js";

// Get all roles_permissions (excluding soft-deleted)
export const getAllRolesPermissions = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, role_name, permissions, status FROM roles_permissions WHERE deleted_at IS NULL ORDER BY created_at"
    );

    // Convert rows into desired format
    const formatted = {};
    result.rows.forEach((row) => {
      formatted[row.id] = {
        role_name: row.role_name,
        permissions: row.permissions,
        status: row.status,
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching roles/permissions:", error.message);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

// Create new roles_permissions record
export const createRolesPermissions = async (req, res) => {
  try {
    const { role_name, permissions, status } = req.body;

    if (
      !role_name ||
      typeof role_name !== "string" ||
      role_name.trim() === "" ||
      !permissions ||
      typeof status !== "boolean"
    ) {
      return res.status(400).json({
        error:
          "role_name (non-empty string), permissions (object), and status (boolean) are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO roles_permissions (role_name, permissions, status) VALUES ($1, $2, $3) RETURNING id, role_name, permissions, status`,
      [role_name.trim(), permissions, status]
    );

    const row = result.rows[0];
    res.status(201).json({
      [row.id]: {
        role_name: row.role_name,
        permissions: row.permissions,
        status: row.status,
      },
    });
  } catch (error) {
    console.error("Error creating roles/permissions:", error.message);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "A role with this name already exists." });
    }
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

// Update existing roles_permissions by id
export const updateRolesPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_name, permissions, status } = req.body;

    if (
      !role_name ||
      typeof role_name !== "string" ||
      role_name.trim() === "" ||
      !permissions ||
      typeof status !== "boolean"
    ) {
      return res.status(400).json({
        error:
          "role_name (non-empty string), permissions (object), and status (boolean) are required",
      });
    }

    const result = await pool.query(
      `UPDATE roles_permissions 
       SET role_name = $1, permissions = $2, status = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 AND deleted_at IS NULL RETURNING id, role_name, permissions, status`,
      [role_name.trim(), permissions, status, id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Record not found or already deleted" });
    }

    const row = result.rows[0];
    res.status(200).json({
      [row.id]: {
        role_name: row.role_name,
        permissions: row.permissions,
        status: row.status,
      },
    });
  } catch (error) {
    console.error("Error updating roles/permissions:", error.message);
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ error: "A role with this name already exists." });
    }
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

// Soft delete roles_permissions
export const deleteRolesPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE roles_permissions SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Record not found or already deleted" });
    }

    res.status(200).json({ message: "Role soft-deleted successfully", id });
  } catch (error) {
    console.error("Error soft-deleting roles/permissions:", error.message);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
};

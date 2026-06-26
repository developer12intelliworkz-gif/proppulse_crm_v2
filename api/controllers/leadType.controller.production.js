import pool from "../config.mjs";
import path from "path";
import fs from "fs/promises";

const uploadDir = path.join(process.cwd(), "public", "lead_icons");
const baseUrl = "https://intelliworkz.digital:4443";

const buildLogoUrl = (logo_image) =>
  logo_image
    ? `${baseUrl}/api/public/lead_icons/${encodeURIComponent(logo_image)}`
    : null;

export const getAllLeadTypes = async (req, res) => {
  try {
    let result;
    try {
      result = await pool.query(
        `SELECT id, name, logo_image, logo_name, is_assignable, sort_order
         FROM lead_types
         WHERE deleted_at IS NULL
         ORDER BY sort_order ASC, created_at ASC`
      );
    } catch (columnErr) {
      result = await pool.query(
        `SELECT id, name, logo_image, logo_name
         FROM lead_types
         WHERE deleted_at IS NULL
         ORDER BY created_at DESC`
      );
      result.rows = result.rows.map((row, index) => ({
        ...row,
        is_assignable: true,
        sort_order: index,
      }));
    }

    const leadTypes = result.rows.map((item) => ({
      ...item,
      logo_url: buildLogoUrl(item.logo_image),
    }));

    res.status(200).json(leadTypes);
  } catch (err) {
    console.error("Error fetching lead types:", err.message);
    res
      .status(500)
      .json({ message: "Failed to fetch lead types", error: err.message });
  }
};

export const createLeadType = async (req, res) => {
  const { name, logo_name, is_assignable } = req.body;
  const logo_image = req.file ? req.file.filename : null;
  const assignable =
    is_assignable === undefined ||
    is_assignable === "true" ||
    is_assignable === true;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    const nextOrderResult = await pool.query(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
       FROM lead_types
       WHERE deleted_at IS NULL`
    );
    const nextOrder = nextOrderResult.rows[0]?.next_order ?? 0;

    const result = await pool.query(
      `INSERT INTO lead_types (name, logo_image, logo_name, is_assignable, sort_order, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING id, name, logo_image, logo_name, is_assignable, sort_order`,
      [name, logo_image, logo_name, assignable, nextOrder]
    );

    const newItem = result.rows[0];
    const logo_url = buildLogoUrl(newItem.logo_image);

    res.status(201).json({
      message: "Lead type created successfully",
      data: { ...newItem, logo_url },
    });
  } catch (err) {
    console.error("Error creating lead type:", err.message);
    res
      .status(500)
      .json({ message: "Failed to create lead type", error: err.message });
  }
};

export const updateLeadType = async (req, res) => {
  const { id } = req.params;

  if (id === "reorder" || id === "order") {
    return res.status(400).json({
      message: "Use POST /leadtype/reorder with a JSON body: { ids: [...] }",
    });
  }

  const { name, logo_name, is_assignable, sort_order } = req.body;
  const logo_image = req.file ? req.file.filename : null;
  const assignable =
    is_assignable === undefined
      ? undefined
      : is_assignable === "true" || is_assignable === true;
  const parsedSortOrder =
    sort_order !== undefined && sort_order !== null && sort_order !== ""
      ? Number(sort_order)
      : undefined;

  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    let query = `
      UPDATE lead_types
      SET name = $1, logo_name = $2`;
    const values = [name, logo_name];
    let paramIndex = 3;

    if (logo_image) {
      query += `, logo_image = $${paramIndex}`;
      values.push(logo_image);
      paramIndex++;
    }

    if (assignable !== undefined) {
      query += `, is_assignable = $${paramIndex}`;
      values.push(assignable);
      paramIndex++;
    }

    if (parsedSortOrder !== undefined && !Number.isNaN(parsedSortOrder)) {
      query += `, sort_order = $${paramIndex}`;
      values.push(parsedSortOrder);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} AND deleted_at IS NULL
               RETURNING id, name, logo_image, logo_name, is_assignable, sort_order`;
    values.push(id);

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Lead type not found or deleted" });
    }

    const updatedItem = result.rows[0];
    const logo_url = buildLogoUrl(updatedItem.logo_image);

    res.status(200).json({
      message: "Lead type updated successfully",
      data: { ...updatedItem, logo_url },
    });
  } catch (err) {
    console.error("Error updating lead type:", err.message);
    res
      .status(500)
      .json({ message: "Failed to update lead type", error: err.message });
  }
};

export const reorderLeadTypes = async (req, res) => {
  const rawIds = req.body?.ids ?? req.body?.order;
  const ids = Array.isArray(rawIds)
    ? rawIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (ids.length === 0) {
    return res.status(400).json({
      message: "ids array is required",
      hint: 'Send POST /api/leadtype/reorder with body: { ids: ["1", "2"] }',
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (let i = 0; i < ids.length; i++) {
      await client.query(
        `UPDATE lead_types
         SET sort_order = $1
         WHERE id::text = $2 AND deleted_at IS NULL`,
        [i, ids[i]]
      );
    }
    await client.query("COMMIT");
    res.status(200).json({ message: "Lead type order updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error reordering lead types:", err.message);
    res
      .status(500)
      .json({ message: "Failed to reorder lead types", error: err.message });
  } finally {
    client.release();
  }
};

export const deleteLeadType = async (req, res) => {
  const { id } = req.params;

  try {
    const fetchRes = await pool.query(
      `SELECT logo_image FROM lead_types WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (fetchRes.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Lead type not found or already deleted" });
    }

    const logo_image = fetchRes.rows[0].logo_image;

    await pool.query(`UPDATE lead_types SET deleted_at = NOW() WHERE id = $1`, [
      id,
    ]);

    if (logo_image) {
      const filePath = path.join(uploadDir, logo_image);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        console.log(`[Delete] Removed file: ${filePath}`);
      } catch (fsErr) {
        if (fsErr.code !== "ENOENT") {
          console.error(`[Delete] Error removing file ${filePath}:`, fsErr);
        }
      }
    }

    res.status(200).json({ message: "Lead type deleted successfully" });
  } catch (err) {
    console.error("Error deleting lead type:", err.message);
    res
      .status(500)
      .json({ message: "Failed to delete lead type", error: err.message });
  }
};

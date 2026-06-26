import pool from "../../database/config.js";

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
         ORDER BY created_at ASC`
      );
      result.rows = result.rows.map((row, index) => ({
        ...row,
        is_assignable: true,
        sort_order: index,
      }));
    }

    const leadTypes = result.rows.map((item) => ({
      ...item,
      logo_url: item.logo_image
        ? `${req.protocol}://${req.get("host")}/public/lead_icons/${
            item.logo_image
          }`
        : null,
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
    is_assignable === undefined || is_assignable === "true" || is_assignable === true;

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
       RETURNING id`,
      [name, logo_image, logo_name, assignable, nextOrder]
    );

    res.status(201).json({
      message: "Lead type created successfully",
      id: result.rows[0].id,
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
    const result = await pool.query(
      `UPDATE lead_types 
       SET name=$1,
           logo_name=$2, 
           logo_image=COALESCE($3, logo_image),
           is_assignable=COALESCE($4, is_assignable),
           sort_order=COALESCE($5, sort_order)
       WHERE id=$6 AND deleted_at IS NULL 
       RETURNING id`,
      [name, logo_name, logo_image, assignable, parsedSortOrder, id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Lead type not found or deleted" });
    }

    res.status(200).json({ message: "Lead type updated successfully" });
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
      hint: "Send POST /api/leadtype/reorder with body: { ids: [\"1\", \"2\"] }",
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
    const result = await pool.query(
      `UPDATE lead_types 
       SET deleted_at=NOW() 
       WHERE id=$1 AND deleted_at IS NULL 
       RETURNING id`,
      [id]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Lead type not found or already deleted" });
    }

    res.status(200).json({ message: "Lead type deleted successfully" });
  } catch (err) {
    console.error("Error deleting lead type:", err.message);
    res
      .status(500)
      .json({ message: "Failed to delete lead type", error: err.message });
  }
};

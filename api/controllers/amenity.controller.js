import pool from "../../database/config.js";

export const listAmenities = async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === "true";
    const result = await pool.query(
      `SELECT id, name, is_active, created_at
       FROM amenity_master
       ${includeInactive ? "" : "WHERE is_active = true"}
       ORDER BY name`,
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("listAmenities error:", error);
    res.status(500).json({ error: "Failed to fetch amenities" });
  }
};

export const createAmenity = async (req, res) => {
  const { name } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: "name is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO amenity_master (name, is_active)
       VALUES ($1, true)
       ON CONFLICT (name) DO UPDATE
         SET is_active = true
       RETURNING id, name, is_active, created_at`,
      [String(name).trim()],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error("createAmenity error:", error);
    res.status(500).json({ error: "Failed to create amenity" });
  }
};

export const updateAmenity = async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;

  try {
    const updates = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
      if (!String(name).trim()) {
        return res.status(400).json({ error: "name cannot be empty" });
      }
      updates.push(`name = $${index++}`);
      values.push(String(name).trim());
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${index++}`);
      values.push(Boolean(is_active));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE amenity_master
       SET ${updates.join(", ")}
       WHERE id = $${index}
       RETURNING id, name, is_active, created_at`,
      values,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Amenity not found" });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "Amenity name already exists" });
    }
    console.error("updateAmenity error:", error);
    res.status(500).json({ error: "Failed to update amenity" });
  }
};

export const deleteAmenity = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE amenity_master SET is_active = false WHERE id = $1 RETURNING id`,
      [id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Amenity not found" });
    }
    res.json({ message: "Amenity deactivated" });
  } catch (error) {
    console.error("deleteAmenity error:", error);
    res.status(500).json({ error: "Failed to deactivate amenity" });
  }
};

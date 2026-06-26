// controllers/project/unitPricing.controller.js

import pool from "../../database/config.js";

// Helper: Check if project exists
const checkProjectExists = async (projectId) => {
  const result = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL",
    [projectId]
  );
  return result.rowCount > 0;
};

// Helper: Check if unit exists and belongs to project
const checkUnitExists = async (projectId, unitId) => {
  const result = await pool.query(
    "SELECT id FROM project_units WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL",
    [unitId, projectId]
  );
  return result.rowCount > 0;
};

// ==================== CREATE UNIT PRICING (New Rate Card / Revision) ====================
export const createPricing = async (req, res) => {
  const { projectId, unitId } = req.params;
  const {
    base_rate_per_sqft, // Mandatory base rate
    total_base_amount, // Optional: can be calculated later
    floor_rise_per_floor, // e.g., 15000 per floor rise
    plc_amount = 0, // Preferential Location Charge
    amenities_charges = 0,
    parking_charges = 0,
    gst_percentage = 5, // Default GST for under-construction
    other_charges = 0,
    discount_amount = 0,
    effective_from, // Date from which this pricing is valid (required)
    effective_to, // Optional: end date for this revision
    remarks,
  } = req.body;

  if (!base_rate_per_sqft || !effective_from) {
    return res.status(400).json({
      error: "base_rate_per_sqft and effective_from are required",
    });
  }

  if (isNaN(base_rate_per_sqft) || base_rate_per_sqft < 0) {
    return res
      .status(400)
      .json({ error: "base_rate_per_sqft must be a non-negative number" });
  }

  try {
    const projectExists = await checkProjectExists(projectId);
    if (!projectExists)
      return res.status(404).json({ error: "Project not found" });

    const unitExists = await checkUnitExists(projectId, unitId);
    if (!unitExists)
      return res
        .status(404)
        .json({ error: "Unit not found or does not belong to this project" });

    // Optional: Prevent overlapping pricing periods
    const overlapCheck = await pool.query(
      `SELECT id FROM unit_pricing 
       WHERE unit_id = $1 
         AND effective_from <= $2
         AND (effective_to IS NULL OR effective_to >= $3)
         AND deleted_at IS NULL`,
      [unitId, effective_to || effective_from, effective_from]
    );

    if (overlapCheck.rowCount > 0) {
      return res.status(409).json({
        error: "Pricing period overlaps with an existing active pricing record",
      });
    }

    const result = await pool.query(
      `INSERT INTO unit_pricing (
        unit_id,
        project_id,
        base_rate_per_sqft,
        total_base_amount,
        floor_rise_per_floor,
        plc_amount,
        amenities_charges,
        parking_charges,
        gst_percentage,
        other_charges,
        discount_amount,
        effective_from,
        effective_to,
        remarks,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING 
        id,
        base_rate_per_sqft,
        total_base_amount,
        floor_rise_per_floor,
        plc_amount,
        amenities_charges,
        parking_charges,
        gst_percentage,
        discount_amount,
        effective_from,
        effective_to,
        remarks,
        created_at`,
      [
        unitId,
        projectId,
        base_rate_per_sqft,
        total_base_amount || null,
        floor_rise_per_floor || null,
        plc_amount,
        amenities_charges,
        parking_charges,
        gst_percentage,
        other_charges,
        discount_amount,
        effective_from,
        effective_to || null,
        remarks || null,
      ]
    );

    res.status(201).json({
      message: "Unit pricing created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("createPricing error:", error);
    res
      .status(500)
      .json({ error: "Failed to create pricing", details: error.message });
  }
};

// ==================== GET PRICING HISTORY FOR A UNIT ====================
export const getPricingHistory = async (req, res) => {
  const { projectId, unitId } = req.params;
  const { current = false } = req.query; // ?current=true to get only active pricing

  try {
    const projectExists = await checkProjectExists(projectId);
    if (!projectExists)
      return res.status(404).json({ error: "Project not found" });

    const unitExists = await checkUnitExists(projectId, unitId);
    if (!unitExists) return res.status(404).json({ error: "Unit not found" });

    let query = `
      SELECT 
        id,
        base_rate_per_sqft,
        total_base_amount,
        floor_rise_per_floor,
        plc_amount,
        amenities_charges,
        parking_charges,
        gst_percentage,
        other_charges,
        discount_amount,
        effective_from,
        effective_to,
        remarks,
        created_at,
        updated_at
      FROM unit_pricing 
      WHERE unit_id = $1 AND project_id = $2 AND deleted_at IS NULL
    `;
    const values = [unitId, projectId];

    if (current === "true") {
      const today = new Date().toISOString().split("T")[0];
      query += ` AND effective_from <= $3 AND (effective_to IS NULL OR effective_to >= $3)`;
      values.push(today);
    }

    query += " ORDER BY effective_from DESC";

    const result = await pool.query(query, values);

    res.json({
      count: result.rowCount,
      current_pricing_only: current === "true",
      data: result.rows,
    });
  } catch (error) {
    console.error("getPricingHistory error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ==================== UPDATE PRICING (Edit a revision) ====================
export const updatePricing = async (req, res) => {
  const { projectId, unitId, pricingId } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  const allowedFields = [
    "base_rate_per_sqft",
    "total_base_amount",
    "floor_rise_per_floor",
    "plc_amount",
    "amenities_charges",
    "parking_charges",
    "gst_percentage",
    "other_charges",
    "discount_amount",
    "effective_from",
    "effective_to",
    "remarks",
  ];

  const setClauses = [];
  const values = [];
  let index = 1;

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      if (
        field === "base_rate_per_sqft" &&
        (isNaN(updates[field]) || updates[field] < 0)
      ) {
        return res
          .status(400)
          .json({ error: "base_rate_per_sqft must be non-negative" });
      }
      setClauses.push(`${field} = $${index++}`);
      values.push(updates[field]);
    }
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  setClauses.push("updated_at = CURRENT_TIMESTAMP");
  values.push(pricingId, unitId, projectId);

  try {
    const result = await pool.query(
      `UPDATE unit_pricing 
       SET ${setClauses.join(", ")}
       WHERE id = $${index - 2}
         AND unit_id = $${index - 1}
         AND project_id = $${index}
         AND deleted_at IS NULL
       RETURNING id, base_rate_per_sqft, effective_from, effective_to`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Pricing record not found" });
    }

    res.json({
      message: "Pricing updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("updatePricing error:", error);
    res.status(500).json({ error: "Failed to update pricing" });
  }
};

// ==================== DELETE PRICING (Soft Delete - Use Carefully) ====================
export const deletePricing = async (req, res) => {
  const { projectId, unitId, pricingId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE unit_pricing 
       SET deleted_at = CURRENT_TIMESTAMP 
       WHERE id = $1 
         AND unit_id = $2 
         AND project_id = $3 
         AND deleted_at IS NULL
       RETURNING id`,
      [pricingId, unitId, projectId]
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Pricing record not found or already deleted" });
    }

    res.json({
      message: "Pricing record deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("deletePricing error:", error);
    res.status(500).json({ error: "Failed to delete pricing" });
  }
};

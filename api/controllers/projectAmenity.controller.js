import pool from "../../database/config.js";

const projectExists = async (projectId) => {
  const result = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL",
    [projectId],
  );
  return result.rowCount > 0;
};

const parseAmenityId = (raw) => {
  const id = Number.parseInt(String(raw), 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const normalizeName = (name) => String(name ?? "").trim();

const mapRow = (row) => ({
  id: row.id,
  project_id: row.project_id,
  name: row.name,
  is_selected: Boolean(row.is_selected),
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const findAmenityForProject = async (projectId, amenityId) => {
  const result = await pool.query(
    `SELECT id, project_id, name, is_selected, created_at, updated_at
     FROM project_amenities
     WHERE id = $1 AND project_id = $2`,
    [amenityId, projectId],
  );
  return result.rows[0] ?? null;
};

const isDuplicateNameError = (error) => error?.code === "23505";

export const getProjectAmenities = async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `SELECT id, project_id, name, is_selected, created_at, updated_at
       FROM project_amenities
       WHERE project_id = $1
       ORDER BY LOWER(name)`,
      [projectId],
    );
    res.json({ data: result.rows.map(mapRow) });
  } catch (error) {
    console.error("getProjectAmenities error:", error);
    res.status(500).json({ error: "Failed to fetch project amenities" });
  }
};

export const createProjectAmenity = async (req, res) => {
  const { projectId } = req.params;
  const name = normalizeName(req.body?.name);
  const isSelected =
    req.body?.is_selected !== undefined
      ? Boolean(req.body.is_selected)
      : true;

  if (!name) {
    return res.status(400).json({ error: "Amenity name is required" });
  }

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `INSERT INTO project_amenities (project_id, name, is_selected)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, name, is_selected, created_at, updated_at`,
      [projectId, name, isSelected],
    );

    res.status(201).json({
      data: mapRow(result.rows[0]),
      message: "Amenity created",
    });
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return res
        .status(409)
        .json({ error: "This amenity already exists for this project" });
    }
    console.error("createProjectAmenity error:", error);
    res.status(500).json({ error: "Failed to create amenity" });
  }
};

export const updateProjectAmenity = async (req, res) => {
  const { projectId } = req.params;
  const amenityId = parseAmenityId(req.params.amenityId);

  if (!amenityId) {
    return res.status(400).json({ error: "Invalid amenity ID" });
  }

  const name =
    req.body?.name !== undefined ? normalizeName(req.body.name) : undefined;
  const isSelected =
    req.body?.is_selected !== undefined
      ? Boolean(req.body.is_selected)
      : undefined;

  if (name === "") {
    return res.status(400).json({ error: "Amenity name cannot be empty" });
  }
  if (name === undefined && isSelected === undefined) {
    return res.status(400).json({ error: "No fields to update" });
  }

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const existing = await findAmenityForProject(projectId, amenityId);
    if (!existing) {
      return res.status(404).json({ error: "Amenity not found for this project" });
    }

    const updates = [];
    const values = [];
    let index = 1;

    if (name !== undefined) {
      updates.push(`name = $${index++}`);
      values.push(name);
    }
    if (isSelected !== undefined) {
      updates.push(`is_selected = $${index++}`);
      values.push(isSelected);
    }
    updates.push(`updated_at = NOW()`);

    values.push(amenityId, projectId);

    const result = await pool.query(
      `UPDATE project_amenities
       SET ${updates.join(", ")}
       WHERE id = $${index++} AND project_id = $${index}
       RETURNING id, project_id, name, is_selected, created_at, updated_at`,
      values,
    );

    res.json({
      data: mapRow(result.rows[0]),
      message: "Amenity updated",
    });
  } catch (error) {
    if (isDuplicateNameError(error)) {
      return res
        .status(409)
        .json({ error: "This amenity already exists for this project" });
    }
    console.error("updateProjectAmenity error:", error);
    res.status(500).json({ error: "Failed to update amenity" });
  }
};

export const deleteProjectAmenity = async (req, res) => {
  const { projectId } = req.params;
  const amenityId = parseAmenityId(req.params.amenityId);

  if (!amenityId) {
    return res.status(400).json({ error: "Invalid amenity ID" });
  }

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `DELETE FROM project_amenities
       WHERE id = $1 AND project_id = $2
       RETURNING id`,
      [amenityId, projectId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Amenity not found for this project" });
    }

    res.json({ message: "Amenity deleted", id: result.rows[0].id });
  } catch (error) {
    console.error("deleteProjectAmenity error:", error);
    res.status(500).json({ error: "Failed to delete amenity" });
  }
};

export const setAllProjectAmenitySelection = async (req, res) => {
  const { projectId } = req.params;
  const isSelected = Boolean(req.body?.is_selected);

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `UPDATE project_amenities
       SET is_selected = $1, updated_at = NOW()
       WHERE project_id = $2
       RETURNING id, project_id, name, is_selected, created_at, updated_at`,
      [isSelected, projectId],
    );

    res.json({
      data: result.rows.map(mapRow),
      message: isSelected ? "All amenities selected" : "All amenities deselected",
    });
  } catch (error) {
    console.error("setAllProjectAmenitySelection error:", error);
    res.status(500).json({ error: "Failed to update amenity selection" });
  }
};

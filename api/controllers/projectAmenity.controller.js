import pool from "../../database/config.js";

const projectExists = async (projectId) => {
  const result = await pool.query(
    "SELECT id FROM projects WHERE id = $1 AND deleted_at IS NULL",
    [projectId],
  );
  return result.rowCount > 0;
};

export const getProjectAmenities = async (req, res) => {
  const { projectId } = req.params;
  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const result = await pool.query(
      `SELECT am.id, am.name, am.is_active, pa.id AS link_id, pa.created_at
       FROM project_amenities pa
       INNER JOIN amenity_master am ON am.id = pa.amenity_id
       WHERE pa.project_id = $1 AND am.is_active = true
       ORDER BY am.name`,
      [projectId],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("getProjectAmenities error:", error);
    res.status(500).json({ error: "Failed to fetch project amenities" });
  }
};

export const linkProjectAmenity = async (req, res) => {
  const { projectId } = req.params;
  const amenityId = req.body.amenity_id ?? req.body.amenityId;

  if (!amenityId) {
    return res.status(400).json({ error: "amenity_id is required" });
  }

  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    const amenityCheck = await pool.query(
      "SELECT id FROM amenity_master WHERE id = $1 AND is_active = true",
      [amenityId],
    );
    if (amenityCheck.rowCount === 0) {
      return res.status(404).json({ error: "Amenity not found" });
    }

    const result = await pool.query(
      `INSERT INTO project_amenities (project_id, amenity_id)
       VALUES ($1, $2)
       ON CONFLICT (project_id, amenity_id) DO NOTHING
       RETURNING id, project_id, amenity_id, created_at`,
      [projectId, amenityId],
    );

    res.status(201).json({
      data: result.rows[0] ?? { project_id: projectId, amenity_id: amenityId },
      message: "Amenity linked to project",
    });
  } catch (error) {
    console.error("linkProjectAmenity error:", error);
    res.status(500).json({ error: "Failed to link amenity" });
  }
};

export const unlinkProjectAmenity = async (req, res) => {
  const { projectId, amenityId } = req.params;
  let client;
  try {
    if (!(await projectExists(projectId))) {
      return res.status(404).json({ error: "Project not found" });
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const unlinkResult = await client.query(
      `DELETE FROM project_amenities
       WHERE project_id = $1 AND amenity_id = $2
       RETURNING id`,
      [projectId, amenityId],
    );
    if (unlinkResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Project amenity link not found" });
    }

    const remainingLinks = await client.query(
      `SELECT COUNT(*)::int AS count FROM project_amenities WHERE amenity_id = $1`,
      [amenityId],
    );
    const linkCount = remainingLinks.rows[0]?.count ?? 0;

    let deletedMaster = false;
    if (linkCount === 0) {
      const masterResult = await client.query(
        `DELETE FROM amenity_master WHERE id = $1 RETURNING id`,
        [amenityId],
      );
      deletedMaster = masterResult.rowCount > 0;
    }

    await client.query("COMMIT");

    res.json({
      message: deletedMaster
        ? "Amenity removed from project and deleted"
        : "Amenity removed from project",
      deletedMaster,
    });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("unlinkProjectAmenity error:", error);
    res.status(500).json({ error: "Failed to remove amenity from project" });
  } finally {
    if (client) client.release();
  }
};

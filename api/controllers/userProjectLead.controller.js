import pool from "../../database/config.js";

// Fetch all projects and leads for a given user
export const getUserProjectsLeads = async (req, res) => {
  const { user_id } = req.params;

  try {
    // Validate user exists
    const userCheck = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL",
      [user_id]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "User not found or inactive" });
    }

    // Fetch ALL projects for this user (sales or created_by)
    const projectsQuery = `
      SELECT *
      FROM projects
      WHERE sales = $1 OR created_by = $1
    `;
    const projectsResult = await pool.query(projectsQuery, [user_id]);

    // Fetch ALL leads for this user (assigned_to)
    const leadsQuery = `
      SELECT *
      FROM leads
      WHERE assigned_to = $1
    `;
    const leadsResult = await pool.query(leadsQuery, [user_id]);

    // Build response with full data
    res.json({
      user_id,
      projects: projectsResult.rows,
      leads: leadsResult.rows,
      project_count: projectsResult.rows.length,
      lead_count: leadsResult.rows.length,
    });
  } catch (error) {
    console.error("Error fetching user projects/leads:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

import pool from "../database/config.js";

async function run() {
  try {
    const unitIds = [1, 2]; // dummy IDs
    const projectId = 75;
    const status = 'available';

    const placeholders = unitIds.map((_, i) => `$${i + 2}`).join(", ");
    const params = [status.trim().toLowerCase(), ...unitIds, projectId];
    const projectIdPlaceholder = `$${unitIds.length + 2}`;

    const query = `UPDATE project_units
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders}) AND project_id = ${projectIdPlaceholder} AND deleted_at IS NULL
       RETURNING *`;
       
    console.log("Query:", query);
    console.log("Params:", params);
    
    const result = await pool.query(query, params);
    console.log("Updated count:", result.rowCount);
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    process.exit(0);
  }
}

run();

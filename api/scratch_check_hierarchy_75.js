import pool from "../database/config.js";

async function run() {
  try {
    const res = await pool.query(`
      SELECT id, parent_id, type_code, name, deleted_at 
      FROM project_hierarchy_nodes 
      WHERE project_id = 75
    `);
    console.log("hierarchy nodes for project 75:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();

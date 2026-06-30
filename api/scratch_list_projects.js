import pool from "../database/config.js";

async function run() {
  try {
    const res = await pool.query(`
      SELECT id, name, project_type, project_structure 
      FROM projects 
      WHERE deleted_at IS NULL
    `);
    console.log("Projects:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();

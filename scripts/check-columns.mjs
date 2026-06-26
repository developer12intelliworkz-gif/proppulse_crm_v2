import pool from "../database/config.js";

const r = await pool.query(
  "SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' ORDER BY column_name",
);
console.log(r.rows.map((x) => x.column_name).join("\n"));
await pool.end();

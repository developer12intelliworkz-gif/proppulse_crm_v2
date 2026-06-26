import pool from "../database/config.js";

const cols = await pool.query(`
  SELECT column_name, data_type, udt_name
  FROM information_schema.columns
  WHERE table_name = 'projects'
    AND column_name IN ('created_by','completed_steps','amenities','launched_on','possession')
`);
console.log("columns:", cols.rows);

const fk = await pool.query(`
  SELECT pg_get_constraintdef(oid) AS def
  FROM pg_constraint
  WHERE conrelid = 'projects'::regclass AND contype = 'f'
`);
console.log("fks:", fk.rows);

const users = await pool.query(`SELECT id, name FROM users LIMIT 3`);
console.log("sample users:", users.rows);

await pool.end();

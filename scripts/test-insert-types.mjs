import pool from "../database/config.js";

const tests = [
  { label: "array literal string", steps: "[1]" },
  { label: "parsed array", steps: [1] },
  { label: "month date", launched: "2026-06" },
  { label: "full date", launched: "2026-06-01" },
];

for (const t of tests) {
  if (t.steps !== undefined) {
    try {
      await pool.query(
        `SELECT $1::int[] AS steps`,
        [t.steps],
      );
      console.log(t.label, "OK", t.steps);
    } catch (e) {
      console.log(t.label, "FAIL", e.message);
    }
  }
  if (t.launched !== undefined) {
    try {
      await pool.query(`SELECT $1::date AS d`, [t.launched]);
      console.log(t.label, "OK", t.launched);
    } catch (e) {
      console.log(t.label, "FAIL", e.message);
    }
  }
}

await pool.end();

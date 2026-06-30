import pool from "./database/config.js";

async function listRoles() {
  try {
    const res = await pool.query("SELECT id, role_name, permissions, status FROM roles_permissions WHERE deleted_at IS NULL");
    console.log("Roles and permissions:");
    res.rows.forEach(r => {
      console.log(`- ${r.role_name} (${r.id}):`, JSON.stringify(r.permissions, null, 2));
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

listRoles();

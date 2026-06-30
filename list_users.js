import pool from "./database/config.js";

async function listUsers() {
  try {
    const res = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_active, u.deleted_at, rp.role_name, u.roles_permissions_id
      FROM users u
      LEFT JOIN roles_permissions rp ON u.roles_permissions_id = rp.id
    `);
    console.log("Users and roles:");
    res.rows.forEach(u => {
      console.log(`- ${u.name} <${u.email}> | Active: ${u.is_active} | Deleted: ${u.deleted_at} | Role: ${u.role_name} (${u.roles_permissions_id})`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

listUsers();

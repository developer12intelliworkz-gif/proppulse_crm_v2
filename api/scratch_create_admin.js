import pool from "../database/config.js";
import bcrypt from "bcrypt";

async function setupAdminUser() {
  try {
    const email = "admin@proppulse.com";
    const password = "Admin@123";
    const hashedPassword = await bcrypt.hash(password, 10);
    const roleId = "459fd983-2f99-4763-bc7f-e3ef84fda339"; // admin role UUID

    // Check if user exists
    const checkUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (checkUser.rows.length > 0) {
      await pool.query(
        "UPDATE users SET password = $1, roles_permissions_id = $2, is_active = true, deleted_at = null WHERE email = $3",
        [hashedPassword, roleId, email]
      );
      console.log("Updated existing admin@proppulse.com password and role!");
    } else {
      await pool.query(
        `INSERT INTO users (id, email, password, name, phone, is_active, roles_permissions_id) 
         VALUES (gen_random_uuid(), $1, $2, 'Admin User', '1234567890', true, $3)`,
        [email, hashedPassword, roleId]
      );
      console.log("Created admin@proppulse.com user with Admin@123 password and admin role!");
    }
  } catch (error) {
    console.error("Error setting up user:", error);
  } finally {
    process.exit();
  }
}

setupAdminUser();

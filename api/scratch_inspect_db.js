import pool from "../database/config.js";

async function run() {
  try {
    // Check tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("TABLES IN DATABASE:");
    console.log(tables.rows.map(r => r.table_name));

    // Inspect roles_permissions
    console.log("\nCOLUMNS IN roles_permissions:");
    const rpCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'roles_permissions'
    `);
    console.log(rpCols.rows);

    // Inspect leads
    console.log("\nCOLUMNS IN leads:");
    const leadCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leads'
    `);
    console.log(leadCols.rows);

    // Print all roles_permissions entries
    console.log("\nROLES_PERMISSIONS ENTRIES:");
    const rpEntries = await pool.query(`
      SELECT id, role_name, JSON_BUILD_OBJECT('role_name', role_name, 'permissions', permissions) as detail
      FROM roles_permissions
      WHERE deleted_at IS NULL
    `);
    rpEntries.rows.forEach(r => {
      console.log(r.id, r.role_name, JSON.stringify(r.detail.permissions));
    });

    // Print active role users details
    console.log("\nACTIVE ROLE USERS:");
    const activeUsers = await pool.query("SELECT id, email, is_active, deleted_at, roles_permissions_id FROM users WHERE deleted_at IS NULL AND roles_permissions_id IS NOT NULL");
    console.log(activeUsers.rows);

    // Print some users
    console.log("\nUSERS:");
    const users = await pool.query(`
      SELECT id, email, name, roles_permissions_id 
      FROM users 
      LIMIT 10
    `);
    console.log(users.rows);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();

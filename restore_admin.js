import pool from "./database/config.js";

async function checkAndRestore() {
  try {
    const res = await pool.query("SELECT * FROM roles_permissions WHERE role_name = 'admin'");
    console.log("Current admin role:", JSON.stringify(res.rows[0], null, 2));

    // Restore the full list of admin permissions to be safe
    const fullAdminPerms = [
      "view_leads", "create_leads", "assign_leads", "delete_leads", "import_leads", "export_leads",
      "view_projects", "create_projects", "edit_projects", "delete_projects", "import_projects", "export_projects",
      "manage_users", "create_users", "import_users", "export_users",
      "view_reports", "export_reports",
      "view_followups",
      "view_settings",
      "view_tasks",
      "manage_lead_types", "create_lead_types",
      "view_roles", "update_roles", "create_roles", "delete_roles"
    ];

    const updateRes = await pool.query(
      "UPDATE roles_permissions SET permissions = $1 WHERE role_name = 'admin' RETURNING *",
      [JSON.stringify({ admin: fullAdminPerms })]
    );
    console.log("Updated admin role permissions:", JSON.stringify(updateRes.rows[0], null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

checkAndRestore();

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
  photo?: string | null;
  roles_permissions_id?: string;
}

export const INITIAL_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    "view_leads",
    "create_leads",
    "assign_leads",
    "view_projects",
    "create_projects",
    "manage_project",
    "edit_projects",
    "delete_projects",
    "create_users",
    "view_reports",
    "export_reports",
    "manage_users",
    "view_followups",
    "view_settings",
    "view_tasks",
    "import_leads",
    "import_projects",
    "import_users",
    "export_leads",
    "export_projects",
    "export_users",
    "manage_lead_types",
    "create_lead_types",
    "view_roles",
    "update_roles",
    "create_roles",
    "delete_roles",
  ],
};

/** Roles that can access leads UI (matches ProtectedRoute). */
export const LEADS_ACCESS_ROLES = [
  "admin",
  "manager",
  "sales",
  "agent",
  "team leader",
  "tl",
  "user(sales)",
];

/** Default permissions for sales-facing roles when API perms are missing. */
export const SALES_UI_PERMISSIONS = [
  "view_leads",
  "view_followups",
  "view_tasks",
];

export function normalizeRole(role?: string | null): string {
  return role?.toLowerCase().trim() || "";
}

export function isLeadsAccessRole(role?: string | null): boolean {
  const r = normalizeRole(role);
  if (!r) return false;
  if (LEADS_ACCESS_ROLES.includes(r)) return true;
  return r.includes("sales");
}

export function isSalesFacingRole(role?: string | null): boolean {
  const r = normalizeRole(role);
  if (!r) return false;
  if (r === "sales" || r === "user(sales)" || r.includes("sales")) return true;
  return ["agent", "team leader", "tl"].includes(r);
}

export function checkPermission(
  role: string | undefined,
  rolePermissions: Record<string, string[]>,
  permission: string,
): boolean {
  const normalized = normalizeRole(role);
  if (!normalized) return false;

  // Enforce permissions strictly according to roles matrix from DB for all roles

  const perms = rolePermissions[normalized] || [];
  return Array.isArray(perms) ? perms.includes(permission) : false;
}

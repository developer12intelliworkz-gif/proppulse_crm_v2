/**
 * Tenant helpers — shared-DB row isolation today, database-per-tenant ready.
 * DEFAULT_COMPANY_ID keeps legacy single-tenant behavior when company_id is unset.
 */

export const DEFAULT_COMPANY_ID =
  process.env.DEFAULT_COMPANY_ID || "60c06a65-d9cb-4df7-89fc-4a77004a353d";

/** Resolve company id from JWT user payload or explicit override. */
export function resolveCompanyId(userOrCompanyId) {
  if (!userOrCompanyId) return DEFAULT_COMPANY_ID;
  if (typeof userOrCompanyId === "string") return userOrCompanyId;
  return userOrCompanyId.company_id || userOrCompanyId.companyId || DEFAULT_COMPANY_ID;
}

/**
 * SQL fragment: match rows for tenant OR legacy null company_id rows.
 * Params: $N = companyId
 */
export function tenantScopeClause(columnName, paramIndex) {
  return `(${columnName} = $${paramIndex} OR ${columnName} IS NULL)`;
}

/** Ensure request company_id matches authenticated tenant (optional strict mode). */
export function assertTenantAccess(req, requestedCompanyId) {
  const tenantId = resolveCompanyId(req.user);
  if (!requestedCompanyId) return tenantId;
  if (requestedCompanyId !== tenantId) {
    const err = new Error("Access denied for this company");
    err.statusCode = 403;
    throw err;
  }
  return tenantId;
}

/**
 * Prefer the user's company_id from the database so onboarding works when the JWT
 * was issued before company registration updated company_id.
 */
export async function assertUserCompanyAccess(req, db, requestedCompanyId) {
  if (!req.user?.id) {
    return assertTenantAccess(req, requestedCompanyId);
  }

  const result = await db.query(
    `SELECT company_id FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [req.user.id],
  );
  const userCompanyId = result.rows[0]?.company_id;

  if (userCompanyId) {
    if (requestedCompanyId && requestedCompanyId !== userCompanyId) {
      const err = new Error("Access denied for this company");
      err.statusCode = 403;
      throw err;
    }
    return userCompanyId;
  }

  return assertTenantAccess(req, requestedCompanyId);
}

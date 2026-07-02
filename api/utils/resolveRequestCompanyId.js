import pool from "../../database/config.js";
import { resolveCompanyId } from "./tenant.js";

/**
 * Resolve the authenticated user's tenant company id.
 * Order: users.company_id → brand.company_id → user_brands → JWT/default.
 */
export async function resolveRequestCompanyId(req, db = pool) {
  if (!req.user?.id) {
    return resolveCompanyId(req.user);
  }

  const userRes = await db.query(
    `SELECT company_id, brand_id FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [req.user.id],
  );
  const row = userRes.rows[0];

  if (row?.company_id) {
    return row.company_id;
  }

  if (row?.brand_id) {
    const brandRes = await db.query(
      `SELECT company_id FROM brands WHERE id = $1`,
      [row.brand_id],
    );
    if (brandRes.rows[0]?.company_id) {
      return brandRes.rows[0].company_id;
    }
  }

  const membershipRes = await db.query(
    `SELECT b.company_id
     FROM user_brands ub
     JOIN brands b ON b.id = ub.brand_id
     WHERE ub.user_id = $1
     ORDER BY ub.is_primary DESC, b.created_at ASC
     LIMIT 1`,
    [req.user.id],
  );
  if (membershipRes.rows[0]?.company_id) {
    return membershipRes.rows[0].company_id;
  }

  return resolveCompanyId(req.user);
}

/**
 * Resolve company + brand for user create/update.
 * Uses the brand's company when the requester is allowed to assign that brand.
 */
export async function resolveCompanyAndBrand(req, brandId, db = pool) {
  const normalized = normalizeBrandId(brandId);
  let companyId = await resolveRequestCompanyId(req, db);

  if (!normalized) {
    return { companyId, brandId: null };
  }

  const brandRes = await db.query(
    `SELECT id, company_id FROM brands WHERE id = $1`,
    [normalized],
  );
  if (brandRes.rowCount === 0) {
    const err = new Error("Invalid brand");
    err.statusCode = 400;
    throw err;
  }

  const brandCompanyId = brandRes.rows[0].company_id;

  if (brandCompanyId === companyId) {
    return { companyId, brandId: normalized };
  }

  if (req.user?.id) {
    const accessRes = await db.query(
      `SELECT 1
       FROM user_brands
       WHERE user_id = $1 AND brand_id = $2
       UNION ALL
       SELECT 1
       FROM users
       WHERE id = $1 AND brand_id = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [req.user.id, normalized],
    );

    if (accessRes.rowCount > 0) {
      return { companyId: brandCompanyId, brandId: normalized };
    }
  }

  const err = new Error("Invalid brand for this company");
  err.statusCode = 400;
  throw err;
}

function normalizeBrandId(value) {
  if (!value || value === "null" || value === "__none__") return null;
  return value;
}
